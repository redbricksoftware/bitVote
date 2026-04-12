import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { getConfig } from "../../shared/config/appConfig";

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: getConfig().auth.jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
