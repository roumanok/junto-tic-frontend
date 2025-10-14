export interface UserMeResponse {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  permissions: {
    additionalProp1: boolean;
    additionalProp2: boolean;
    additionalProp3: boolean;
  };
  email_verified: boolean;
  session_state: string;
  auth_method: string;
}

export interface UserProfile {
  sub?: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  communityRoles?: string[];
}