export interface Message {
    role: "user" | "assistant";
    content: string;
}

export interface ClaudeRequestBody {
    messages: Message[];
    system?: string;
    max_tokens?: number;
}

export interface ClaudeProxyResponse {
    reply: string;
    input_tokens: number;
    output_tokens: number;
}

export interface ErrorResponse {
    error: string;
    details?: string;
}