import { describe, it, expect } from 'vitest';
import { parseJsonFromAI } from '../utils/parse-ai-json.js';

describe('AI JSON Parsing Robustness', () => {
  it('should parse clean JSON', () => {
    const input = '{"tips": [{"text": "Hello", "action": "/test"}]}';
    const result = parseJsonFromAI<any>(input);
    expect(result.tips[0].text).toBe('Hello');
  });

  it('should parse JSON within Markdown blocks', () => {
    const input = 'Here is the advice:\n```json\n{"tips": [{"text": "Markdown", "action": "/test"}]}\n```\nHope this helps!';
    const result = parseJsonFromAI<any>(input);
    expect(result.tips[0].text).toBe('Markdown');
  });

  it('should parse JSON with leading/trailing text', () => {
    const input = 'The results are: {"tips": [{"text": "Mixed", "action": "/test"}]} - End of message';
    const result = parseJsonFromAI<any>(input);
    expect(result.tips[0].text).toBe('Mixed');
  });

  it('should handle complex nested JSON with multiple braces', () => {
    const input = 'Start { "a": { "b": 1 } } End';
    const result = parseJsonFromAI<any>(input);
    expect(result.a.b).toBe(1);
  });

  it('should throw helpful error for truncated JSON', () => {
    const input = '{ "tips": [ { "text": "Hello"';
    expect(() => parseJsonFromAI(input)).toThrow(/truncated/);
  });

  it('should throw error when no JSON is present', () => {
    const input = 'This is just plain text without any braces.';
    expect(() => parseJsonFromAI(input)).toThrow(/No JSON object found/);
  });
});
