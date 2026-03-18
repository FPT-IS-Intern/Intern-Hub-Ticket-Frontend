import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * HTTP interceptor — Snowflake ID safe JSON parser.
 *
 * Problem:
 *   JavaScript Number is IEEE-754 double → safe integers only up to 2^53 − 1 (9_007_199_254_740_991).
 *   Snowflake IDs are 64-bit (up to 19 digits) → JSON.parse() silently loses last 2–3 digits.
 *
 * Solution:
 *   1. Intercept all JSON responses, request raw text instead
 *   2. Scan the raw JSON text character-by-character
 *   3. Wrap any bare integer > MAX_SAFE_INTEGER in double quotes → becomes a JSON string
 *   4. Parse the modified JSON safely
 *
 * This is a safety net. The backend SHOULD already serialize Long fields as strings
 * via @JsonSerialize(using = ToStringSerializer.class). This interceptor catches any
 * field that was missed or added later without the annotation.
 */
export const bigIntInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.responseType !== 'json') {
        return next(req);
    }

    const textReq = req.clone({ responseType: 'text' });

    return next(textReq).pipe(
        map(event => {
            if (!(event instanceof HttpResponse)) return event;

            const raw = event.body;
            if (!raw || typeof raw !== 'string') {
                return event.clone({ body: null });
            }

            try {
                return event.clone({ body: JSON.parse(wrapUnsafeIntegers(raw)) });
            } catch {
                // Fallback: parse without wrapping (e.g. non-standard JSON)
                try {
                    return event.clone({ body: JSON.parse(raw) });
                } catch {
                    return event;
                }
            }
        })
    );
};

// ─────────────────────────────────────────────────────────────
// Core logic: character-by-character JSON scanner
// ─────────────────────────────────────────────────────────────

/** MAX_SAFE_INTEGER as a string for lexicographic comparison (16 chars). */
const MAX_SAFE_STR = '9007199254740991';

/**
 * Scan raw JSON text. Any bare integer whose absolute value > MAX_SAFE_INTEGER
 * is wrapped in double quotes so JSON.parse() yields a string instead of a lossy number.
 *
 * Rules:
 *  - Strings (inside "...") are copied verbatim — their content is never touched.
 *  - Floating-point numbers (contain '.', 'e', 'E') are left as-is.
 *  - Only bare integers with |value| > 9_007_199_254_740_991 are wrapped.
 */
export function wrapUnsafeIntegers(json: string): string {
    const len = json.length;
    let out = '';
    let i = 0;

    while (i < len) {
        const ch = json[i];

        // ── Skip JSON string literals ──
        if (ch === '"') {
            const end = skipString(json, i);
            out += json.substring(i, end + 1);
            i = end + 1;
            continue;
        }

        // ── Detect a number token ──
        if (ch === '-' || (ch >= '0' && ch <= '9')) {
            const start = i;
            if (ch === '-') i++;

            // Read integer part
            while (i < len && json[i] >= '0' && json[i] <= '9') i++;

            // If followed by '.', 'e', 'E' → floating point, skip entirely
            if (i < len && (json[i] === '.' || json[i] === 'e' || json[i] === 'E')) {
                while (i < len && !isJsonTerminator(json[i])) i++;
                out += json.substring(start, i);
                continue;
            }

            const token = json.substring(start, i);
            out += needsWrapping(token) ? '"' + token + '"' : token;
            continue;
        }

        // ── Any other character ──
        out += ch;
        i++;
    }

    return out;
}

/**
 * Determine if an integer token (e.g. "154477677087035392" or "-12345678901234567")
 * exceeds Number.MAX_SAFE_INTEGER and therefore needs to be wrapped as a string.
 */
function needsWrapping(token: string): boolean {
    const abs = token[0] === '-' ? token.substring(1) : token;
    const digits = abs.length;

    // MAX_SAFE_INTEGER has 16 digits → anything with 17+ digits is always unsafe
    if (digits > 16) return true;
    // Fewer than 16 digits → always safe
    if (digits < 16) return false;
    // Exactly 16 digits → lexicographic comparison
    return abs > MAX_SAFE_STR;
}

/** Find the closing quote of a JSON string, respecting escape sequences. */
function skipString(json: string, openQuote: number): number {
    let i = openQuote + 1;
    while (i < json.length) {
        if (json[i] === '\\') {
            i += 2; // skip escaped character
        } else if (json[i] === '"') {
            return i;
        } else {
            i++;
        }
    }
    return json.length - 1; // malformed JSON fallback
}

/** Returns true if the character terminates a JSON number token. */
function isJsonTerminator(ch: string): boolean {
    return ch === ',' || ch === '}' || ch === ']'
        || ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t';
}
