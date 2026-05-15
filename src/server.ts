import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ClaudeRequestBody, ClaudeProxyResponse, ErrorResponse } from "./types";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(
    cors({
        origin: ALLOWED_ORIGIN,
    })
);

// ── Validation ────────────────────────────────────────────────────────────────

function validateApiKey(_req: Request, res: Response, next: NextFunction): void {
    if (!ANTHROPIC_API_KEY) {
        res.status(500).json({
            error: "Server misconfiguration: ANTHROPIC_API_KEY is not set.",
        } as ErrorResponse);
        return;
    }
    next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check — useful for Portainer and uptime monitors
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main proxy endpoint — called by your Mendix extension
app.post(
    "/ask-claude",
    validateApiKey,
    async (req: Request, res: Response): Promise<void> => {
        const { messages, system, max_tokens } = req.body as ClaudeRequestBody;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400).json({
                error: "Request must include a non-empty messages array.",
            } as ErrorResponse);
            return;
        }

        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": ANTHROPIC_API_KEY!,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-6",
                    max_tokens: max_tokens ?? 1024,
                    ...(system && { system }),
                    messages,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Anthropic API error:", response.status, errorBody);
                res.status(response.status).json({
                    error: "Anthropic API returned an error.",
                    details: errorBody,
                } as ErrorResponse);
                return;
            }

            const data = await response.json() as any;

            const result: ClaudeProxyResponse = {
                reply: data.content[0].text,
                input_tokens: data.usage.input_tokens,
                output_tokens: data.usage.output_tokens,
            };

            res.json(result);
        } catch (err) {
            console.error("Unexpected error:", err);
            res.status(500).json({
                error: "An unexpected error occurred.",
                details: err instanceof Error ? err.message : String(err),
            } as ErrorResponse);
        }
    }
);

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`mendix-claude-proxy running on port ${PORT}`);
});