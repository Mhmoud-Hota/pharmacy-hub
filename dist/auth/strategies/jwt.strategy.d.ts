import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    private readonly lastWrite;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: number;
        phone: string;
        name: string;
    }): Promise<{
        sub: number;
        phone: string;
        name: string;
    }>;
    private touchActivity;
}
export {};
