const express      = require('express');
const router       = express.Router();
const axios        = require('axios');
const rateLimit    = require('express-rate-limit');
const { verifyToken, requireRole } = require('../middleware/auth');
const Prescription = require('../models/Prescription');

const drugLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { message: 'Rate limit exceeded' } });

async function resolveRxCUI(drugName) {
  try {
    const res = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`);
    const ids = res.data && res.data.idGroup && res.data.idGroup.rxnormId;
    return ids && ids.length > 0 ? ids[0] : null;
  } catch {
    return null;
  }
}

router.post('/interactions', verifyToken, requireRole('doctor'), drugLimiter, async (req, res) => {
  try {
    const { drugName, patientId } = req.body || {};

    const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 }).limit(3);
    const existingDrugs = [];
    prescriptions.forEach(p => p.medications.forEach(m => { if (m.name) existingDrugs.push(m.name); }));

    const newRxCUI = await resolveRxCUI(drugName);
    if (!newRxCUI) return res.json({ severity: 'unknown', detail: 'Drug not found in RxNav database', interactions: [] });

    const rxcuis = [newRxCUI];
    for (const drug of existingDrugs) {
      const cui = await resolveRxCUI(drug);
      if (cui && !rxcuis.includes(cui)) rxcuis.push(cui);
    }

    if (rxcuis.length < 2) return res.json({ severity: 'safe', detail: 'No other medications to check against', interactions: [] });

    const interactionRes = await axios.get(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join('+')}`);
    const groups = interactionRes.data && interactionRes.data.fullInteractionTypeGroup;

    if (!groups || groups.length === 0) return res.json({ severity: 'safe', detail: 'No known interactions found', interactions: [] });

    let severity = 'safe';
    let detail   = 'No significant interactions found';

    for (const group of groups) {
      for (const type of (group.fullInteractionType || [])) {
        for (const pair of (type.interactionPair || [])) {
          const desc = (pair.description || '').toLowerCase();
          if (desc.includes('contraindicated') || desc.includes('major')) {
            severity = 'danger';
            detail   = pair.description;
            break;
          } else if (desc.includes('moderate') && severity !== 'danger') {
            severity = 'caution';
            detail   = pair.description;
          } else if (severity === 'safe') {
            severity = 'safe';
            detail   = pair.description || detail;
          }
        }
      }
    }

    res.json({ severity, detail, interactions: groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
