import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { Officer, OfficerWithCounts } from './officer.interface';
import { ApplicationsRepository } from '../applications/applications.repository';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class OfficersService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ApplicationsRepository))
    private readonly applicationsRepository: ApplicationsRepository,
  ) {}

  /**
   * Return field officers with dynamically computed assignedCount and verifiedCount.
   * Scoped by municipality_id when provided.
   */
  findAll(municipalityId?: string): OfficerWithCounts[] {
    const allUsers = this.usersService.findAll();
    let fieldOfficers = allUsers.filter((u) => u.role === Role.FIELD_OFFICER);
    if (municipalityId) {
      fieldOfficers = fieldOfficers.filter(
        (u) => (u.municipality_id || '').toLowerCase() === municipalityId.toLowerCase(),
      );
    }
    const allApps = this.applicationsRepository.find();

    return fieldOfficers.map((officer) => {
      const assignedCount = allApps.filter(
        (a) =>
          a.assignedOfficerId === officer.user_id &&
          a.application_status === ApplicationStatus.ASSIGNED,
      ).length;

      const verifiedCount = allApps.filter(
        (a) =>
          a.assignedOfficerId === officer.user_id &&
          a.application_status === ApplicationStatus.VERIFIED,
      ).length;

      return {
        id: officer.user_id,
        name: officer.full_name,
        municipality_id: officer.municipality_id,
        email: officer.email,
        phone: officer.phone,
        role: officer.role,
        assignedCount,
        verifiedCount,
      };
    });
  }

  findOne(id: number): OfficerWithCounts {
    const user = this.usersService.findOne(id);
    if (!user || user.role !== Role.FIELD_OFFICER) {
      throw new NotFoundException(`Field Officer with ID ${id} not found`);
    }

    const allApps = this.applicationsRepository.find();
    const assignedCount = allApps.filter(
      (a) =>
        a.assignedOfficerId === id &&
        a.application_status === ApplicationStatus.ASSIGNED,
    ).length;

    const verifiedCount = allApps.filter(
      (a) =>
        a.assignedOfficerId === id &&
        a.application_status === ApplicationStatus.VERIFIED,
    ).length;

    return {
      id: user.user_id,
      name: user.full_name,
      municipality_id: user.municipality_id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      assignedCount,
      verifiedCount,
    };
  }

  /**
   * Find the field officer with the minimum assignedCount within the given municipality.
   * If tie, pick the first one in the array.
   */
  findLeastLoaded(municipalityId?: string): Officer {
    const officersWithCounts = this.findAll(municipalityId);
    if (officersWithCounts.length === 0) {
      throw new NotFoundException(
        `No field officers available for assignment in municipality '${municipalityId || 'all'}'`,
      );
    }

    let leastLoaded = officersWithCounts[0];
    for (let i = 1; i < officersWithCounts.length; i++) {
      if (officersWithCounts[i].assignedCount < leastLoaded.assignedCount) {
        leastLoaded = officersWithCounts[i];
      }
    }

    return leastLoaded;
  }
}

