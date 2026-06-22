// import React from 'react';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import {
//   addTimeSignatureSegment,
//   removeTimeSignatureSegment,
//   setAccentPattern,
//   setTimeSignature,
//   setTimeSignatureDenom,
//   setUseTimeSignatureSequence,
//   updateTimeSignatureSegment,
//   type TimeSignatureDenominator,
// } from '@/store/slices/metronomeSlice';

// const DENOMS: TimeSignatureDenominator[] = [2, 4, 8, 16];

// interface MetronomeLeftAdvancedPanelProps {
//   setShowAdvanced: (value: boolean) => void;
// }

// export const MetronomeLeftAdvancedPanel: React.FC<MetronomeLeftAdvancedPanelProps> = ({
//   setShowAdvanced,
// }) => {
//   const dispatch = useAppDispatch();
//   const {
//     isPlaying,
//     timeSignature,
//     timeSignatureDenom,
//     accentPattern,
//     useTimeSignatureSequence,
//     timeSignatureSegments,
//   } = useAppSelector((state) => state.metronome);

//   const denomDisabled = isPlaying || useTimeSignatureSequence;
//   const sequenceEditDisabled = isPlaying;
//   const sequenceFocus = useTimeSignatureSequence;

//   const handleSequenceToggle = (checked: boolean) => {
//     dispatch(setUseTimeSignatureSequence(checked));
//     if (checked && timeSignatureSegments[0]) {
//       const s = timeSignatureSegments[0];
//       dispatch(setTimeSignature(s.numerator));
//       dispatch(setTimeSignatureDenom(s.denominator));
//     }
//   };

//   return (
//     <div className={`advanced-control ${sequenceFocus ? 'advanced-control--sequence-only' : ''}`}>
//       {sequenceFocus ? (
//         <>
//           <label>Meter sequence</label>
//           <p className="ts-sequence-focus-hint">
//             Uncheck the option above to return to time signature, denominator, and accents.
//           </p>
//         </>
//       ) : (
//         <>
//           <label>Advanced Settings</label>

//           <div className="advanced-setting">
//             <span className="advanced-label">Time Signature</span>
//             <div className="advanced-time-signature-display">
//               <span className="advanced-time-signature-numerator">{timeSignature}</span>
//               <span className="advanced-time-signature-slash">/</span>
//               <span className="advanced-time-signature-denominator">{timeSignatureDenom}</span>
//             </div>
//             <div className="advanced-denominator-hint">Change denominator below</div>
//             <div className="time-signature-denominator-buttons">
//               {DENOMS.map((d) => (
//                 <button
//                   key={d}
//                   type="button"
//                   className={`time-signature-denom-button ${timeSignatureDenom === d ? 'active' : ''}`}
//                   onClick={() => dispatch(setTimeSignatureDenom(d))}
//                   disabled={denomDisabled}
//                 >
//                   {d}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="advanced-setting">
//             <span className="advanced-label">Accent Pattern</span>
//             <div className="accent-pattern-buttons">
//               {accentPattern.map((accented, index) => (
//                 <button
//                   key={index}
//                   type="button"
//                   className={`accent-pattern-button ${accented ? 'active' : ''}`}
//                   onClick={() => {
//                     const newPattern = [...accentPattern];
//                     newPattern[index] = !newPattern[index];
//                     dispatch(setAccentPattern(newPattern));
//                   }}
//                   disabled={isPlaying}
//                 >
//                   {index + 1}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <span className="advanced-label ts-sequence-section-label">Bar sequence</span>
//         </>
//       )}

//       <div className={`advanced-setting ts-sequence-block ${sequenceFocus ? 'ts-sequence-block--focus' : ''}`}>
//         <div
//           className={`ts-sequence-card ${sequenceFocus ? 'ts-sequence-card--on' : ''} ${
//             isPlaying ? 'ts-sequence-card--disabled' : ''
//           }`}
//         >
//           <label className="ts-sequence-card-header">
//             <input
//               type="checkbox"
//               className="ts-sequence-card-checkbox"
//               checked={useTimeSignatureSequence}
//               onChange={(e) => handleSequenceToggle(e.target.checked)}
//               disabled={isPlaying}
//               aria-controls={useTimeSignatureSequence ? 'ts-sequence-panel' : undefined}
//             />
//             <span className="ts-sequence-card-header-text">
//               <span className="ts-sequence-card-title">Use different meters per segment</span>
//               {!sequenceFocus && (
//                 <span className="ts-sequence-card-hint">
//                   Turn on to build a loop: e.g. 4 bars of 4/4, then 2 of 5/4, then 7/8…
//                 </span>
//               )}
//               {sequenceFocus && (
//                 <span className="ts-sequence-card-status">
//                   {timeSignatureSegments.length} segment{timeSignatureSegments.length === 1 ? '' : 's'} · loops while
//                   playing
//                 </span>
//               )}
//             </span>
//             <span className="ts-sequence-card-chevron" aria-hidden>
//               <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
//                 <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
//               </svg>
//             </span>
//           </label>

//           {useTimeSignatureSequence && (
//             <div
//               className="ts-sequence-panel"
//               id="ts-sequence-panel"
//               role="region"
//               aria-label="Time signature segments"
//             >
//               <p className="ts-sequence-help">
//                 Each row is <strong>number of bars</strong> at that <strong>meter</strong>. Playback runs top to bottom
//                 and repeats.
//               </p>
//               <div className="ts-sequence-rows-scroll">
//                 <div className="ts-sequence-rows">
//                 {timeSignatureSegments.map((seg, index) => (
//                   <div key={seg.id} className="ts-sequence-row">
//                     <span className="ts-sequence-row-index" aria-hidden>
//                       {index + 1}
//                     </span>
//                     <label className="ts-sequence-field">
//                       <span className="ts-sequence-field-label">Bars</span>
//                       <input
//                         type="number"
//                         className="ts-sequence-input"
//                         min={1}
//                         max={999}
//                         value={seg.bars}
//                         disabled={sequenceEditDisabled}
//                         onChange={(e) => {
//                           const v = parseInt(e.target.value, 10);
//                           if (Number.isNaN(v)) return;
//                           dispatch(updateTimeSignatureSegment({ id: seg.id, patch: { bars: v } }));
//                         }}
//                       />
//                     </label>
//                     <label className="ts-sequence-field ts-sequence-meter">
//                       <span className="ts-sequence-field-label">Meter</span>
//                       <div className="ts-sequence-meter-inputs">
//                         <input
//                           type="number"
//                           className="ts-sequence-input ts-sequence-input-narrow"
//                           min={1}
//                           max={19}
//                           value={seg.numerator}
//                           disabled={sequenceEditDisabled}
//                           onChange={(e) => {
//                             const v = parseInt(e.target.value, 10);
//                             if (Number.isNaN(v)) return;
//                             dispatch(updateTimeSignatureSegment({ id: seg.id, patch: { numerator: v } }));
//                           }}
//                         />
//                         <span className="ts-sequence-slash">/</span>
//                         <div className="ts-sequence-denom-group">
//                           {DENOMS.map((d) => (
//                             <button
//                               key={d}
//                               type="button"
//                               className={`ts-sequence-denom ${seg.denominator === d ? 'active' : ''}`}
//                               disabled={sequenceEditDisabled}
//                               onClick={() =>
//                                 dispatch(updateTimeSignatureSegment({ id: seg.id, patch: { denominator: d } }))
//                               }
//                             >
//                               {d}
//                             </button>
//                           ))}
//                         </div>
//                       </div>
//                     </label>
//                     <button
//                       type="button"
//                       className="ts-sequence-remove"
//                       disabled={sequenceEditDisabled || timeSignatureSegments.length <= 1}
//                       onClick={() => dispatch(removeTimeSignatureSegment(seg.id))}
//                       aria-label={`Remove segment ${index + 1}`}
//                     >
//                       ×
//                     </button>
//                   </div>
//                 ))}
//                 </div>
//               </div>
//               <div className="ts-sequence-add-row">
//                 <button
//                   type="button"
//                   className="ts-sequence-add"
//                   disabled={sequenceEditDisabled}
//                   onClick={() => dispatch(addTimeSignatureSegment())}
//                 >
//                   + Add segment
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <button
//         className="advanced-button"
//         onClick={() => setShowAdvanced(false)}
//         disabled={isPlaying}
//       >
//         ◄ Basic
//       </button>
//     </div>
//   );
// };
