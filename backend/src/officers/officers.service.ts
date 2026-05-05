import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { OfficersRepository } from './officers.repository';
import { Officer, OfficerWithCounts } from './officer.interface';
import { ApplicationsRepository } from '../applications/applications.repository';
import { ApplicationStatus } from '../common/enums/application-status.enum';

@Injectable()
export class OfficersService {
  constructor(
    private readonly officersRepository: OfficersRepository,
    @Inject(forwardRef(() => ApplicationsRepository))
    private readonly applicationsRepository: ApplicationsRepository,
  ) {}

  /**
   * Return all officers with dynamically computed assignedCount and verifiedCount.
   * Counts are DERIVED from the applications array — never stored.
   */
  findAll(): OfficerWithCounts[] {
    const officers = this.officersRepository.find();
    const allApps = this.applicationsRepository.find();

    return officers.map((officer) => {
      const assignedCount = allApps.filter(
        (a) =>
          a.assignedOfficerId === officer.id &&
          a.application_status === ApplicationStatus.ASSIGNED,
      ).length;

      const verifiedCount = allApps.filter(
        (a) =>
          a.assignedOfficerId === officer.id &&
          a.application_status === ApplicationStatus.VERIFIED,
      ).length;

      return { ...officer, assignedCount, verifiedCount };
    });
  }

  findOne(id: number): OfficerWithCounts {
    const officer = this.officersRepository.findById(id);
    if (!officer) {
      throw new NotFoundException(`Officer with ID ${id} not found`);
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

    return { ...officer, assignedCount, verifiedCount };
  }

  /**
   * Find the officer with the minimum assignedCount.
   * If tie, pick the first one in the array.
   */
  findLeastLoaded(): Officer {
    const officersWithCounts = this.findAll();
    if (officersWithCounts.length === 0) {
      throw new NotFoundException('No officers available for assignment');
    }

    let leastLoaded = officersWithCounts[0];
    for (let i = 1; i < officersWithCounts.length; i++) {
      if (officersWithCounts[i].assignedCount < leastLoaded.assignedCount) {
        leastLoaded = officersWithCounts[i];
      }
    }

    return leastLoaded;
  }

  create(name: string): Officer {
    return this.officersRepository.create(name);
  }
}
