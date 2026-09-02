import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MunicipalitiesRepository } from './municipalities.repository';
import { Municipality } from './municipality.interface';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class MunicipalitiesService {
  constructor(
    private readonly repository: MunicipalitiesRepository,
    private readonly usersService: UsersService,
  ) {}

  findAll(): Municipality[] {
    return this.repository.find();
  }

  findActive(): Municipality[] {
    return this.repository.find().filter((m) => m.status === 'active');
  }

  findOne(id: string): Municipality {
    const municipality = this.repository.findById(id);
    if (!municipality) {
      throw new NotFoundException(`Municipality with ID '${id}' not found`);
    }
    return municipality;
  }

  /**
   * Determine and validate the target municipality from applicant location or municipality ID.
   * Enforces server-side resolution and rejects invalid or conflicting mappings.
   */
  resolveMunicipality(state?: string, city?: string, requestedMuniId?: string): Municipality {
    const active = this.findActive();
    const normalizedState = (state || '').trim().toLowerCase();
    const normalizedCity = (city || '').trim().toLowerCase();
    const normalizedReqId = (requestedMuniId || '').trim().toLowerCase();

    if (!normalizedState && !normalizedCity && !normalizedReqId) {
      throw new BadRequestException('State and city/district are required to determine the municipal corporation.');
    }

    let matchedMuni: Municipality | undefined;

    // Location aliases/synonyms per jurisdiction
    const aliases: Record<string, string[]> = {
      'muni-blr': ['bangalore', 'bengaluru', 'bbmp', 'bengaluru urban', 'bengaluru rural', 'bangalore urban'],
      'muni-hyd': ['hyderabad', 'secunderabad', 'ghmc', 'greater hyderabad'],
    };

    if (normalizedState || normalizedCity) {
      // 1. Check known aliases and active municipalities dynamically
      for (const m of active) {
        const mId = m.municipality_id.toLowerCase().trim();
        const mState = m.state.toLowerCase().trim();
        const mDistrict = m.district.toLowerCase().trim();
        const mName = m.name.toLowerCase().trim();

        const stateMatches = !normalizedState || mState === normalizedState || mState.includes(normalizedState) || normalizedState.includes(mState);
        const aliasList = aliases[mId] || [];
        const cityMatches =
          !normalizedCity ||
          mDistrict === normalizedCity ||
          mDistrict.includes(normalizedCity) ||
          normalizedCity.includes(mDistrict) ||
          mName.includes(normalizedCity) ||
          normalizedCity.includes(mName) ||
          aliasList.some((alias) => normalizedCity === alias || normalizedCity.includes(alias) || alias.includes(normalizedCity));

        if (normalizedState && normalizedCity) {
          if (stateMatches && cityMatches) {
            matchedMuni = m;
            break;
          }
        } else if (normalizedState && stateMatches) {
          matchedMuni = m;
          break;
        } else if (normalizedCity && cityMatches) {
          matchedMuni = m;
          break;
        }
      }
    }

    // If a requested municipality_id was also explicitly provided:
    if (normalizedReqId) {
      const explicitMuni = active.find((m) => m.municipality_id.toLowerCase() === normalizedReqId);
      if (!explicitMuni) {
        throw new BadRequestException(
          `Municipality '${requestedMuniId}' does not exist or is inactive.`,
        );
      }

      // Check conflict if location was also provided and resolved to a DIFFERENT municipality.
      // If location lookup failed to find any match but an explicit municipality_id is valid,
      // trust the explicit municipality_id — do NOT throw just because location lookup found no match.
      if (matchedMuni && matchedMuni.municipality_id.toLowerCase() !== normalizedReqId) {
        throw new BadRequestException(
          `Provided municipality '${requestedMuniId}' conflicts with application location (${city || 'N/A'}, ${state || 'N/A'})`,
        );
      }

      return explicitMuni;
    }

    if (!matchedMuni) {
      throw new BadRequestException(
        `No active municipal corporation found for location '${city || 'N/A'}, ${state || 'N/A'}'.`,
      );
    }

    return matchedMuni;
  }

  create(data: CreateMunicipalityDto): Municipality {
    const existing = this.repository.findById(data.municipality_id);
    if (existing) {
      throw new ConflictException(
        `Municipality with ID '${data.municipality_id}' already exists`,
      );
    }

    const muniId = data.municipality_id.trim().toLowerCase();

    const record: Municipality = {
      municipality_id: muniId,
      name: data.name.trim(),
      state: data.state.trim(),
      district: data.district.trim(),
      status: data.status || 'active',
      base_processing_fee: data.base_processing_fee ?? 1200,
      platform_fee: data.platform_fee ?? 250,
      service_tax_percentage: data.service_tax_percentage ?? 5,
      created_at: new Date(),
    };

    const created = this.repository.create(record);

    if (data.head_email && data.head_email.trim()) {
      try {
        const headEmail = data.head_email.trim().toLowerCase();
        const existingUser = this.usersService.findAll().find((u) => u.email.toLowerCase() === headEmail);
        if (!existingUser) {
          this.usersService.create({
            full_name: data.head_name?.trim() || `${data.name.trim()} Head`,
            email: headEmail,
            phone: data.head_phone?.trim() || '',
            role: Role.MUNICIPAL_COMMISSIONER,
            password_hash: (data as any).head_password || 'TradeZo@123',
            municipality_id: muniId,
          });
        }
      } catch (err) {
        // Continue even if head user creation encountered non-critical error
      }
    }

    return created;
  }

  update(id: string, data: UpdateMunicipalityDto): Municipality {
    this.findOne(id);
    const updated = this.repository.update(id, data);
    if (!updated) {
      throw new NotFoundException(`Municipality with ID '${id}' not found`);
    }
    return updated;
  }

  remove(id: string): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
