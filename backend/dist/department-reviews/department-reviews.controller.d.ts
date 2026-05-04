import { DepartmentReviewsService } from './department-reviews.service';
import { CreateDepartmentReviewDto } from './dto/create-department-review.dto';
import { UpdateDepartmentReviewDto } from './dto/update-department-review.dto';
import { SignReviewDto } from './dto/sign-review.dto';
export declare class DepartmentReviewsController {
    private readonly service;
    constructor(service: DepartmentReviewsService);
    create(createDto: CreateDepartmentReviewDto): import("./review.interface").DepartmentReview;
    findAll(): import("./review.interface").DepartmentReview[];
    findByApplication(applicationId: number): import("./review.interface").DepartmentReview[];
    findByReviewer(reviewerId: number): import("./review.interface").DepartmentReview[];
    findOne(id: number): import("./review.interface").DepartmentReview;
    update(id: number, updateDto: UpdateDepartmentReviewDto): import("./review.interface").DepartmentReview;
    signReview(id: number, signDto: SignReviewDto): import("./review.interface").DepartmentReview;
    remove(id: number): void;
}
