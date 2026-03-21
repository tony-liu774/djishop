/**
 * LLM Service - Integration with GPT-4o-mini for AI-generated performance summaries
 * Acts as a masterclass instructor providing actionable feedback
 */

class LLMService {
    constructor() {
        this.apiEndpoint = '/api/ai-summary';
        this.isProcessing = false;
    }

    /**
     * Generate an AI-powered performance summary
     * @param {Object} sessionData - The session log data
     * @param {Object} sessionData.summary - Summary statistics
     * @param {Array} sessionData.recent_deviations - Recent deviations for context
     * @returns {Promise<Object>} AI-generated summary with natural language feedback
     */
    async generateSummary(sessionData) {
        if (this.isProcessing) {
            console.warn('LLMService: Already processing a request');
            return null;
        }

        this.isProcessing = true;

        try {
            const prompt = this.buildPrompt(sessionData);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    session_data: sessionData
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            return {
                success: true,
                summary: result.summary,
                recommendations: result.recommendations || [],
                problem_measures: result.problem_measures || [],
                overall_assessment: result.overall_assessment || '',
                generated_at: Date.now()
            };

        } catch (error) {
            console.error('LLMService: Error generating summary:', error);
            return {
                success: false,
                error: error.message,
                fallback: this.generateFallbackSummary(sessionData)
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Build a prompt for the LLM based on session data
     * @param {Object} sessionData - Session data
     * @returns {string} Formatted prompt
     */
    buildPrompt(sessionData) {
        const { summary, recent_deviations } = sessionData;

        const prompt = `You are a masterclass violin instructor providing feedback to a student after their practice session.

Based on the following performance data, provide a concise, encouraging, and actionable summary:

PERFORMANCE STATISTICS:
- Total notes played: ${summary.total_notes_played}
- Pitch deviations: ${summary.pitch_deviation_count}
- Rhythm deviations: ${summary.rhythm_deviation_count}
- Intonation issues: ${summary.intonation_deviation_count}
- Average pitch deviation: ${summary.average_pitch_deviation_cents} cents
- Average rhythm deviation: ${summary.average_rhythm_deviation_ms} ms
- Problem measures: ${summary.problem_measures.map(m => `measure ${m.measure} (${m.error_count} errors)`).join(', ') || 'none'}

RECENT DEVIATIONS:
${JSON.stringify(recent_deviations.slice(-10), null, 2)}

Please provide your feedback in this JSON format:
{
  "overall_assessment": "A 1-2 sentence overall assessment of the performance",
  "strengths": ["1-2 specific things the student did well"],
  "areas_for_improvement": ["2-3 specific areas that need work"],
  "specific_guidance": "2-3 sentences of specific, actionable guidance focusing on the most problematic areas",
  "recommended_measures": [list of 2-3 measure numbers that need the most practice],
  "suggested_tempo": suggested tempo for practice (usually slower than original, e.g., 60-80% of original)
}`;

        return prompt;
    }

    /**
     * Generate a fallback summary when API is unavailable
     * @param {Object} sessionData - Session data
     * @returns {Object} Fallback summary
     */
    generateFallbackSummary(sessionData) {
        const { summary } = sessionData;

        const pitchQuality = summary.average_pitch_deviation_cents < 15 ? 'good' :
            summary.average_pitch_deviation_cents < 30 ? 'acceptable' : 'needs work';
        const rhythmQuality = summary.average_rhythm_deviation_ms < 20 ? 'good' :
            summary.average_rhythm_deviation_ms < 50 ? 'acceptable' : 'needs work';

        const problemMeasures = summary.problem_measures.slice(0, 3).map(m => m.measure);
        const suggestedTempo = Math.max(40, Math.round(120 * 0.7)); // 70% of default tempo

        return {
            overall_assessment: `Your overall ${pitchQuality} intonation and ${rhythmQuality} timing show ${summary.pitch_deviation_count + summary.rhythm_deviation_count} areas for improvement.`,
            strengths: [
                summary.pitch_deviation_count < summary.total_notes_played * 0.3 ? 'Consistent pitch accuracy' : 'Good effort in practice',
                summary.rhythm_deviation_count < summary.total_notes_played * 0.3 ? 'Steady rhythmic foundation' : 'Attempted musical phrases'
            ],
            areas_for_improvement: [
                summary.average_pitch_deviation_cents >= 15 ? 'Focus on pitch accuracy in position shifts' : 'Maintain current intonation',
                summary.average_rhythm_deviation_ms >= 20 ? 'Work on rhythmic precision' : 'Continue developing timing',
                'Practice the identified problem measures slowly'
            ],
            specific_guidance: `Focus your practice on measures ${problemMeasures.join(', ')} at ${suggestedTempo} BPM. Use a metronome and gradually increase tempo once comfortable. Pay special attention to the transitions between notes.`,
            recommended_measures: problemMeasures,
            suggested_tempo: suggestedTempo,
            is_fallback: true
        };
    }

    /**
     * Check if the service is currently processing
     * @returns {boolean} Processing status
     */
    isBusy() {
        return this.isProcessing;
    }
}

window.LLMService = LLMService;
