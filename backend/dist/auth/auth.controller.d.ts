import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(credentials: LoginDto): {
        accessToken: string;
        user: {
            user_id: number;
            full_name: string;
            email: string;
            phone: string;
            role: import("../common/enums/role.enum").Role;
        };
    };
}
