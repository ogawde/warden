export type GitLabOAuthTokens = {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number;
  createdAt: number;
};

export type GitLabTokenApiResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  created_at?: number;
  error?: string;
  error_description?: string;
};
