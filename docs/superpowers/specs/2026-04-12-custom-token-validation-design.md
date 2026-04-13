# Custom Token Validation Design

## Problem

When a host app integrates the bitVote React component, it likely already has its own auth system. Users shouldn't need to adopt bitVote's registration/login/refresh flow. The backend needs a way to accept and validate tokens from the host app's auth system, and the frontend needs to pass through the host app's existing token.

## Design Decisions

- The host app provides a custom `TokenValidator` via NestJS dependency injection (implementing an abstract class)
- The validator returns a `ValidatedUser` object (`{ userId: string, email?: string }`) — it both validates and extracts identity, supporting any token format
- When custom auth is active, bitVote's built-in auth endpoints (register, login, refresh, logout) are not registered
- No `User` entity is created in bitVote's DB for external users — ownership columns become plain strings with no FK
- The existing JWT auth becomes the default implementation of the same `TokenValidator` interface
- Frontend auto-detects external auth mode when `token` or `getToken` props are provided, hiding the login/register UI

## Backend

### Token Validator Interface

```typescript
// auth/interfaces/token-validator.interface.ts
export interface ValidatedUser {
  userId: string;
  email?: string;
}

export abstract class TokenValidator {
  abstract validate(token: string): Promise<ValidatedUser | null>;
}
```

Returns `ValidatedUser` on success, `null` on failure. If the implementation throws, the guard catches it and treats it as a validation failure (returns 401).

### Default JWT Implementation

```typescript
// auth/validators/jwt-token-validator.ts
@Injectable()
export class JwtTokenValidator extends TokenValidator {
  constructor(private jwtService: JwtService) {}

  async validate(token: string): Promise<ValidatedUser | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: getConfig().auth.jwtSecret,
      });
      return { userId: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }
}
```

### Unified Token Guard

Replaces the Passport-based `AccessTokenGuard`:

```typescript
// auth/guards/token.guard.ts
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private tokenValidator: TokenValidator) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) return false;

    try {
      const user = await this.tokenValidator.validate(token);
      if (!user) return false;
      request.user = user; // { userId, email? }
      return true;
    } catch {
      return false;
    }
  }

  private extractToken(request: Request): string | null {
    const auth = request.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
```

### Dynamic Auth Module

```typescript
// auth/auth.module.ts
@Module({})
export class AuthModule {
  static forRoot(options?: { tokenValidator?: Type<TokenValidator> }): DynamicModule {
    const validatorProvider: Provider = options?.tokenValidator
      ? { provide: TokenValidator, useClass: options.tokenValidator }
      : { provide: TokenValidator, useClass: JwtTokenValidator };

    const isCustomAuth = !!options?.tokenValidator;

    return {
      module: AuthModule,
      imports: isCustomAuth ? [] : [JwtModule.register({}), TypeOrmModule.forFeature([User])],
      providers: isCustomAuth
        ? [validatorProvider, TokenGuard]
        : [validatorProvider, TokenGuard, AccessTokenStrategy, RefreshTokenStrategy, AuthService],
      controllers: isCustomAuth ? [] : [AuthController],
      exports: [TokenValidator, TokenGuard],
    };
  }
}
```

When `tokenValidator` is provided:
- No `AuthController` (no `/auth/*` routes)
- No `User` entity registered with TypeORM
- No JWT/Passport dependencies loaded

### Host App Usage

```typescript
// Host app's AppModule
@Module({
  imports: [
    BitVoteModule.forRoot({ tokenValidator: MyAppTokenValidator }),
  ],
})
export class AppModule {}

// Host app's validator
@Injectable()
export class MyAppTokenValidator extends TokenValidator {
  constructor(private myAuthService: MyAuthService) {}

  async validate(token: string): Promise<ValidatedUser | null> {
    const session = await this.myAuthService.verifySession(token);
    if (!session) return null;
    return { userId: session.userId, email: session.email };
  }
}
```

### Controller Changes

All `user.sub` references become `user.userId` to match the `ValidatedUser` shape. Applies to `bitvote.controller.ts` and `voting.controller.ts`. The `AccessTokenGuard` is replaced with `TokenGuard` everywhere.

## Database Schema Changes

### Remove User FK Relationships

`Bitvote.ownerId`, `Comparison.userId`, and `UserRanking.userId` lose their `@ManyToOne(() => User)` and `@JoinColumn` decorators. They remain as plain `@Column()` strings.

Before:
```typescript
@Column()
ownerId: string;

@ManyToOne(() => User)
@JoinColumn({ name: 'ownerId' })
owner: User;
```

After:
```typescript
@Column()
ownerId: string;
```

Same pattern for `Comparison.userId` and `UserRanking.userId`.

### Migration

A TypeORM migration drops foreign key constraints on:
- `bitvotes.ownerId`
- `comparisons.userId`
- `user_rankings.userId`

The columns themselves remain — only the FK constraints are removed.

### User Entity

The `User` entity stays in the codebase but is only registered with TypeORM when using built-in auth (default mode). It becomes internal to the default JWT auth implementation.

### AppModule Entity Registration

The `User` entity in `AppModule`'s TypeORM `entities` array becomes conditional — only included when using built-in auth. This is handled by the `AuthModule.forRoot()` method importing `TypeOrmModule.forFeature([User])` only in default mode. The `AppModule` root `TypeOrmModule.forRoot()` `entities` array should remove `User` — it will be registered via `forFeature` in `AuthModule` when needed.

## Frontend

### New Props on BitVoteProvider

```typescript
interface BitVoteProviderProps {
  apiUrl: string
  token?: string
  getToken?: () => string | null | Promise<string | null>
  children: React.ReactNode
}
```

- `token` — static token string, host app keeps it current (already exists)
- `getToken` — called before each API request for a fresh token (new)

Either prop triggers "external auth" mode.

### External Auth Mode Behavior

When `token` or `getToken` is provided:
- Auth UI (login/register) is not rendered
- `login()`, `register()`, `logout()` become no-ops
- Refresh-on-401 logic is skipped — host app owns token lifecycle
- On 401: if `getToken` exists, call it for a fresh token and retry once. If retry fails or no `getToken`, surface the error.

### Built-in Auth Mode (No token/getToken)

Everything works exactly as it does today. No behavioral change.

### ApiClient Changes

The client gets an optional `getToken` function. When set, it's called before each request:

```typescript
if (this.getToken) {
  const freshToken = await this.getToken()
  if (freshToken) headers['Authorization'] = `Bearer ${freshToken}`
} else if (this.accessToken) {
  headers['Authorization'] = `Bearer ${this.accessToken}`
}
```

### Conditional Auth UI

The component that renders login/register forms checks for external auth mode (`token` or `getToken` provided) and skips rendering. If `getToken` is provided but returns `null`, show a "not authenticated" state rather than the login form.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid/expired token | `TokenGuard` returns 401. Frontend retries with `getToken` if available, otherwise surfaces error. |
| Validator throws | Guard catches, returns 401. Internal errors not leaked. |
| Missing Authorization header | Guard returns 401 immediately. |
| `getToken` is async | `ApiClient` awaits it. No deduplication — host app can add its own. |
| No token and no `getToken` | Built-in auth mode — shows login UI. |
| `getToken` returns null | External auth mode — shows "not authenticated" state, not login form. |
