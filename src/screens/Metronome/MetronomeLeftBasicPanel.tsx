// import React from 'react';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import { setSubdivision, setTimeSignature, type Subdivision } from '@/store/slices/metronomeSlice';

// interface MetronomeLeftBasicPanelProps {
//   isLoggedIn: boolean;
//   setShowAdvanced: (value: boolean) => void;
// }

// export const MetronomeLeftBasicPanel: React.FC<MetronomeLeftBasicPanelProps> = ({
//   isLoggedIn,
//   setShowAdvanced,
// }) => {
//   const dispatch = useAppDispatch();
//   const { isPlaying, subdivision, timeSignature, timeSignatureDenom, useTimeSignatureSequence } =
//     useAppSelector((state) => state.metronome);

//   const advanceDisabled = isPlaying || !isLoggedIn;

//   return (
//     <>
//       <div className="subdivision-control">
//         <label>Subdivision</label>
//         <div className="subdivision-buttons">
//           <button
//             className={`subdivision-button ${subdivision === 'quarters' ? 'active' : ''}`}
//             onClick={() => dispatch(setSubdivision('quarters' as Subdivision))}
//             disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
//           >
//             ♩
//           </button>
//           <button
//             className={`subdivision-button ${subdivision === 'eighths' ? 'active' : ''}`}
//             onClick={() => dispatch(setSubdivision('eighths' as Subdivision))}
//             disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
//           >
//             ♫
//           </button>
//           <button
//             className={`subdivision-button ${subdivision === 'sixteenths' ? 'active' : ''}`}
//             onClick={() => dispatch(setSubdivision('sixteenths' as Subdivision))}
//             disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
//           >
//             ♬♬
//           </button>
//           <button
//             className={`subdivision-button ${subdivision === 'triplets' ? 'active' : ''} `}
//             onClick={() => dispatch(setSubdivision('triplets' as Subdivision))}
//             disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
//           >
//             <div className="triplet-notation">
//               <div className="triplet-line"></div>
//               <span>♩♩♩</span>
//             </div>
//           </button>
//         </div>
//         {(timeSignatureDenom === 8 || timeSignatureDenom === 16) && (
//           <div className="subdivision-disabled-hint">
//             Subdivision is automatically set based on denominator
//           </div>
//         )}
//       </div>

//       <div className="time-signature-control">
//         <label>Time Signature</label>
//         <div className="time-signature-input-group">
//           <button
//             className="time-signature-button"
//             onClick={() => {
//               if (timeSignature > 1) dispatch(setTimeSignature(timeSignature - 1));
//             }}
//             disabled={isPlaying || useTimeSignatureSequence || timeSignature <= 1}
//           >
//             −
//           </button>
//           <input
//             type="number"
//             className="time-signature-input"
//             min="1"
//             max="19"
//             value={timeSignature}
//             onChange={(e) => {
//               const value = parseInt(e.target.value, 10);
//               if (!isNaN(value) && value >= 1 && value <= 19) {
//                 dispatch(setTimeSignature(value));
//               }
//             }}
//             disabled={isPlaying || useTimeSignatureSequence}
//           />
//           <span className="time-signature-slash">/</span>
//           <div className="time-signature-denominator-display">{timeSignatureDenom}</div>
//           <button
//             className="time-signature-button"
//             onClick={() => {
//               if (timeSignature < 19) dispatch(setTimeSignature(timeSignature + 1));
//             }}
//             disabled={isPlaying || useTimeSignatureSequence || timeSignature >= 19}
//           >
//             +
//           </button>
//         </div>
//         {useTimeSignatureSequence && (
//           <p className="time-signature-sequence-hint">Set meters in Advanced → Bar sequence</p>
//         )}
//       </div>

//       {/* Advanced Button */}
//       <div className={`advanced-auth-tooltip-wrapper ${!isLoggedIn ? 'locked' : ''}`}>
//         <button
//           className={`advanced-button ${!isLoggedIn ? 'locked' : ''}`}
//           onClick={() => {
//             if (advanceDisabled) return;
//             setShowAdvanced(true);
//           }}
//         >
//           {isLoggedIn ? 'Advanced ►' : '🔒 Advanced ►'}
//         </button>
//         {!isLoggedIn && (
//           <div className="advanced-auth-tooltip" role="tooltip">
//             Login required
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

