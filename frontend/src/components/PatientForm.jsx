/**
 * PatientForm — Multi-section form for all 55 clinical input features.
 */
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Loader2, Users } from 'lucide-react';
import { fetchSamplePatients } from '../utils/api';

const DEFAULT_PATIENT = {
  age: 55, weight: 75, length: 170, sex: 'Male',
  dm: 0, htn: 0, current_smoker: 0, ex_smoker: 0, fh: 0,
  obesity: 'N', crf: 'N', cva: 'N', airway_disease: 'N',
  thyroid_disease: 'N', chf: 'N', dlp: 'N',
  bp: 120, pr: 75, edema: 0,
  weak_peripheral_pulse: 'N', lung_rales: 'N',
  systolic_murmur: 'N', diastolic_murmur: 'N',
  typical_chest_pain: 0, dyspnea: 'N', function_class: 0,
  atypical: 'N', nonanginal: 'N', exertional_cp: 'N', lowth_ang: 'N',
  q_wave: 0, st_elevation: 0, st_depression: 0, tinversion: 0,
  lvh: 'N', poor_r_progression: 'N', bbb: 'N',
  fbs: 90, cr: 1.0, tg: 150, ldl: 100, hdl: 45,
  bun: 15, esr: 10, hb: 14.0, k: 4.5, na: 140,
  wbc: 7000, lymph: 35, neut: 55, plt: 250,
  ef_tte: 55, region_rwma: 0, vhd: 'N',
};

function NumberInput({ label, name, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label} {unit && <span className="text-slate-500">({unit})</span>}</label>
      <input
        type="number" name={name} value={value} min={min} max={max} step={step}
        onChange={onChange}
        className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-teal-400 focus:outline-none transition-colors"
      />
    </div>
  );
}

function SelectInput({ label, name, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <select
        name={name} value={value} onChange={onChange}
        className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:border-teal-400 focus:outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleInput({ label, name, value, onChange, onVal = 1, offVal = 0 }) {
  const isOn = value === onVal || value === 'Y';
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <label className="text-xs text-slate-400">{label}</label>
      <button
        type="button"
        onClick={() => {
          const isYN = typeof onVal === 'string';
          const newVal = isOn ? (isYN ? 'N' : 0) : (isYN ? 'Y' : 1);
          onChange({ target: { name, value: newVal } });
        }}
        className={`w-9 h-5 rounded-full transition-colors duration-200 relative ${isOn ? 'bg-teal-500' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${isOn ? 'left-4.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function Section({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-700/80 transition-colors text-sm font-medium text-slate-200"
      >
        {title}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="p-3 bg-slate-800/30 space-y-2">{children}</div>}
    </div>
  );
}

export default function PatientForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULT_PATIENT);
  const [samples, setSamples] = useState([]);
  const [showSamples, setShowSamples] = useState(false);

  useEffect(() => {
    fetchSamplePatients().then(setSamples).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate BMI
      if (name === 'weight' || name === 'length') {
        const w = parseFloat(name === 'weight' ? value : prev.weight) || 70;
        const h = parseFloat(name === 'length' ? value : prev.length) || 170;
        updated.bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
      }
      return updated;
    });
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const num = value === '' ? '' : Number(value);
    handleChange({ target: { name, value: num } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const loadSample = (sample) => {
    setForm(sample.data);
    setShowSamples(false);
  };

  const yn = [{ value: 'Y', label: 'Yes' }, { value: 'N', label: 'No' }];

  return (
    <form onSubmit={handleSubmit} className="space-y-2 text-sm">
      {/* Sample Patients */}
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowSamples(!showSamples)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600/60 text-xs"
          >
            <Users size={14} /> Load Sample Patient
          </button>
          {showSamples && samples.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
              {samples.map((s, i) => (
                <button
                  key={i} type="button"
                  onClick={() => loadSample(s)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 text-xs border-b border-slate-700 last:border-0"
                >
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="block text-slate-400">{s.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Section title="👤 Demographics" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Age" name="age" value={form.age} onChange={handleNumericChange} min={0} max={120} unit="yrs" />
          <SelectInput label="Sex" name="sex" value={form.sex} onChange={handleChange}
            options={[{ value: 'Male', label: 'Male' }, { value: 'Fmale', label: 'Female' }]} />
          <NumberInput label="Weight" name="weight" value={form.weight} onChange={handleNumericChange} min={20} max={300} unit="kg" />
          <NumberInput label="Height" name="length" value={form.length} onChange={handleNumericChange} min={100} max={220} unit="cm" />
        </div>
        {form.bmi && <p className="text-xs text-slate-500 mt-1">BMI: {form.bmi}</p>}
      </Section>

      <Section title="🏥 Comorbidities">
        <div className="grid grid-cols-1 gap-0.5">
          <ToggleInput label="Diabetes (DM)" name="dm" value={form.dm} onChange={handleChange} />
          <ToggleInput label="Hypertension (HTN)" name="htn" value={form.htn} onChange={handleChange} />
          <ToggleInput label="Current Smoker" name="current_smoker" value={form.current_smoker} onChange={handleChange} />
          <ToggleInput label="Ex-Smoker" name="ex_smoker" value={form.ex_smoker} onChange={handleChange} />
          <ToggleInput label="Family History" name="fh" value={form.fh} onChange={handleChange} />
          <ToggleInput label="Obesity" name="obesity" value={form.obesity} onChange={handleChange} onVal="Y" offVal="N" />
          <ToggleInput label="Chronic Renal Failure" name="crf" value={form.crf} onChange={handleChange} onVal="Y" offVal="N" />
          <ToggleInput label="CVA" name="cva" value={form.cva} onChange={handleChange} onVal="Y" offVal="N" />
          <ToggleInput label="Airway Disease" name="airway_disease" value={form.airway_disease} onChange={handleChange} onVal="Y" offVal="N" />
          <ToggleInput label="Thyroid Disease" name="thyroid_disease" value={form.thyroid_disease} onChange={handleChange} onVal="Y" offVal="N" />
          <ToggleInput label="CHF" name="chf" value={form.chf} onChange={handleChange} onVal="Y" offVal="N" />
          <ToggleInput label="Dyslipidemia (DLP)" name="dlp" value={form.dlp} onChange={handleChange} onVal="Y" offVal="N" />
        </div>
      </Section>

      <Section title="🩺 Clinical Examination">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Blood Pressure" name="bp" value={form.bp} onChange={handleNumericChange} min={50} max={300} unit="mmHg" />
          <NumberInput label="Pulse Rate" name="pr" value={form.pr} onChange={handleNumericChange} min={30} max={250} unit="bpm" />
        </div>
        <ToggleInput label="Edema" name="edema" value={form.edema} onChange={handleChange} />
        <ToggleInput label="Weak Peripheral Pulse" name="weak_peripheral_pulse" value={form.weak_peripheral_pulse} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Lung Rales" name="lung_rales" value={form.lung_rales} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Systolic Murmur" name="systolic_murmur" value={form.systolic_murmur} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Diastolic Murmur" name="diastolic_murmur" value={form.diastolic_murmur} onChange={handleChange} onVal="Y" offVal="N" />
      </Section>

      <Section title="💊 Symptoms">
        <ToggleInput label="Typical Chest Pain" name="typical_chest_pain" value={form.typical_chest_pain} onChange={handleChange} />
        <ToggleInput label="Dyspnea" name="dyspnea" value={form.dyspnea} onChange={handleChange} onVal="Y" offVal="N" />
        <NumberInput label="Function Class" name="function_class" value={form.function_class} onChange={handleNumericChange} min={0} max={4} />
        <ToggleInput label="Atypical" name="atypical" value={form.atypical} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Nonanginal" name="nonanginal" value={form.nonanginal} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Exertional CP" name="exertional_cp" value={form.exertional_cp} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Low TH Angina" name="lowth_ang" value={form.lowth_ang} onChange={handleChange} onVal="Y" offVal="N" />
      </Section>

      <Section title="📊 ECG Findings">
        <ToggleInput label="Q Wave" name="q_wave" value={form.q_wave} onChange={handleChange} />
        <ToggleInput label="ST Elevation" name="st_elevation" value={form.st_elevation} onChange={handleChange} />
        <ToggleInput label="ST Depression" name="st_depression" value={form.st_depression} onChange={handleChange} />
        <ToggleInput label="T Inversion" name="tinversion" value={form.tinversion} onChange={handleChange} />
        <ToggleInput label="LVH" name="lvh" value={form.lvh} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Poor R Progression" name="poor_r_progression" value={form.poor_r_progression} onChange={handleChange} onVal="Y" offVal="N" />
        <ToggleInput label="Bundle Branch Block" name="bbb" value={form.bbb} onChange={handleChange} onVal="Y" offVal="N" />
      </Section>

      <Section title="🧪 Lab Results">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="FBS" name="fbs" value={form.fbs} onChange={handleNumericChange} min={30} max={600} unit="mg/dL" />
          <NumberInput label="Creatinine" name="cr" value={form.cr} onChange={handleNumericChange} min={0.1} max={20} step={0.1} unit="mg/dL" />
          <NumberInput label="Triglycerides" name="tg" value={form.tg} onChange={handleNumericChange} min={20} max={1000} unit="mg/dL" />
          <NumberInput label="LDL" name="ldl" value={form.ldl} onChange={handleNumericChange} min={10} max={500} unit="mg/dL" />
          <NumberInput label="HDL" name="hdl" value={form.hdl} onChange={handleNumericChange} min={5} max={150} unit="mg/dL" />
          <NumberInput label="BUN" name="bun" value={form.bun} onChange={handleNumericChange} min={1} max={150} unit="mg/dL" />
          <NumberInput label="ESR" name="esr" value={form.esr} onChange={handleNumericChange} min={0} max={150} />
          <NumberInput label="Hemoglobin" name="hb" value={form.hb} onChange={handleNumericChange} min={3} max={25} step={0.1} unit="g/dL" />
          <NumberInput label="Potassium" name="k" value={form.k} onChange={handleNumericChange} min={2} max={8} step={0.1} unit="mEq/L" />
          <NumberInput label="Sodium" name="na" value={form.na} onChange={handleNumericChange} min={110} max={170} unit="mEq/L" />
          <NumberInput label="WBC" name="wbc" value={form.wbc} onChange={handleNumericChange} min={1000} max={50000} />
          <NumberInput label="Lymphocyte %" name="lymph" value={form.lymph} onChange={handleNumericChange} min={0} max={100} />
          <NumberInput label="Neutrophil %" name="neut" value={form.neut} onChange={handleNumericChange} min={0} max={100} />
          <NumberInput label="Platelet" name="plt" value={form.plt} onChange={handleNumericChange} min={20} max={1000} unit="×10³" />
        </div>
      </Section>

      <Section title="🫀 Echocardiography">
        <NumberInput label="Ejection Fraction (EF)" name="ef_tte" value={form.ef_tte} onChange={handleNumericChange} min={5} max={80} unit="%" />
        <NumberInput label="Region RWMA" name="region_rwma" value={form.region_rwma} onChange={handleNumericChange} min={0} max={4} />
        <SelectInput label="Valvular Heart Disease" name="vhd" value={form.vhd} onChange={handleChange}
          options={[
            { value: 'N', label: 'None' },
            { value: 'mild', label: 'Mild' },
            { value: 'Moderate', label: 'Moderate' },
            { value: 'Severe', label: 'Severe' },
          ]}
        />
      </Section>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Analyzing...
          </>
        ) : (
          '🔬 Predict Cardiovascular Risk'
        )}
      </button>
    </form>
  );
}
