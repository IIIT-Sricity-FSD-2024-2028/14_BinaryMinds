import { DepartmentReviewsRepository } from './department-reviews.repository';
import { DepartmentReview } from './review.interface';
import { CreateDepartmentReviewDto } from './dto/create-department-review.dto';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
export declare class DepartmentReviewsService {
    private readonly repository;
    private readonly applicationsService;
    private readonly usersService;
    constructor(repository: DepartmentReviewsRepository, applicationsService: ApplicationsService, usersService: UsersService);
    findAll(): DepartmentReview[];
    findOne(id: number): DepartmentReview;
    findByApplication(applicationId: number): DepartmentReview[];
    findByReviewer(reviewerId: number): DepartmentReview[];
    create(data: CreateDepartmentReviewDto): DepartmentReview;
    update(id: number, updateData: Partial<DepartmentReview>): DepartmentReview;
    signReview(id: number, signature: string): DepartmentReview;
    remove(id: number): void;
}
