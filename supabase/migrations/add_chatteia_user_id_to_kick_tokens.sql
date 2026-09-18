-- Add chatteia_user_id to kick_tokens table
ALTER TABLE kick_tokens
ADD COLUMN chatteia_user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX idx_kick_tokens_chatteia_user_id ON kick_tokens(chatteia_user_id);