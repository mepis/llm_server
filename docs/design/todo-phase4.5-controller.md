# Phase 4.5: Update llamaController.js for New TTS Flow

## Goal
Update `src/controllers/llamaController.js` to support inline voice cloning via `speakerAudio` (base64 WAV bytes) instead of the old `speakerFile` path parameter used by llama.cpp TTS.

---

## Todo Items

### 4.5.1 — Update `generateAudio` controller function

**File path:** `/home/jon/git/llm_server/src/controllers/llamaController.js`

**Current function (lines 58-75):**
```javascript
const generateAudio = async (req, res) => {
  try {
    const { text, speakerFile, useGuideTokens } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const base64Wav = await llamaService.generateAudio(text, {
      speakerFile,
      useGuideTokens: useGuideTokens || false,
    });

    res.json({ success: true, data: base64Wav });
  } catch (error) {
    logger.error('TTS generation failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**Action:** Replace with the updated function:
```javascript
const generateAudio = async (req, res) => {
  try {
    const { text, speakerFile, speakerAudio, useGuideTokens } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const options = {};
    if (speakerAudio && typeof speakerAudio === 'string') {
      options.speakerAudio = speakerAudio;
    }

    const base64Wav = await llamaService.generateAudio(text, options);

    res.json({ success: true, data: base64Wav });
  } catch (error) {
    logger.error('TTS generation failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**Key changes:**
- Added `speakerAudio` to destructured request body parameters
- Removed `speakerFile` and `useGuideTokens` from options (no longer used by Chatterbox)
- Created `options` object that only includes `speakerAudio` when provided
- The `speakerAudio` value is base64-encoded WAV bytes sent from the frontend for inline voice cloning

**Verify:**
- Controller destructures `text`, `speakerFile`, `speakerAudio`, `useGuideTokens` from `req.body`
- Only `speakerAudio` is passed to `llamaService.generateAudio()` in options
- Old `speakerFile` and `useGuideTokens` parameters are still destructured (for backward compatibility) but not used

---

## Phase 4.5 Completion Checklist

Before moving to Phase 5, verify all of the following:

- [ ] `generateAudio` controller destructures `speakerAudio` from request body
- [ ] `options` object only contains `speakerAudio` when provided (not `speakerFile` or `useGuideTokens`)
- [ ] `llamaService.generateAudio()` receives `text` and `options` parameters
- [ ] No references to `speakerFile` in options passed to service
