declare interface AuthBody{
    grant_type: string,
    username?: string,
    password?: string,
    client_id: string,
    client_secret: string;
    refresh_token?: string;
}

declare interface AuthResponse{
    access_token: string,
    token_type: string,
    expires_in: number,
    refresh_token: string,
    role: string
}