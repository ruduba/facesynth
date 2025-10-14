//components/Editor/Controls.jsx

export default function Controls({ controls, onChange, disabled }) {
  const controlGroups = [
    {
      title: 'Jaw & Chin',
      controls: [
        { name: 'jawWidth', label: 'Jaw Width', min: 0.6, max: 1.6, step: 0.05 },
        { name: 'chinHeight', label: 'Chin Height', min: 0.6, max: 1.8, step: 0.05 }
      ]
    },
    {
      title: 'Mouth',
      controls: [
        { name: 'mouthWidth', label: 'Mouth Width', min: 0.6, max: 1.7, step: 0.05 }
      ]
    },
    {
      title: 'Nose',
      controls: [
        { name: 'noseLength', label: 'Nose Length', min: 0.6, max: 1.6, step: 0.05 }
      ]
    },
    {
      title: 'Eyes',
      controls: [
        { name: 'eyeSize', label: 'Eye Size', min: 0.6, max: 1.5, step: 0.05 },
        { name: 'eyeSpacing', label: 'Eye Spacing', min: 0.7, max: 1.3, step: 0.05 }
      ]
    },
    {
      title: 'Cheeks',
      controls: [
        { name: 'cheekPuff', label: 'Cheek Puff', min: 0.6, max: 1.6, step: 0.05 }
      ]
    },
    {
      title: 'Overall',
      controls: [
        { name: 'faceScale', label: 'Face Scale', min: 0.7, max: 1.5, step: 0.05 }
      ]
    }
  ];

  const handleSliderChange = (name, value) => {
    onChange(name, parseFloat(value));
  };

  return (
    <div className="controls-panel">
      <div className="panel-header">
        <h3>Controls</h3>
      </div>

      <div className="panel-content">
        {disabled && (
          <div className="disabled-overlay">
            <p>Capture a baseline face first</p>
          </div>
        )}

        {controlGroups.map(group => (
          <div key={group.title} className="control-group">
            <h4>{group.title}</h4>
            {group.controls.map(control => (
              <div key={control.name} className="control-item">
                <label>
                  {control.label}
                  <span className="control-value">
                    {controls[control.name]?.toFixed(2) || '1.00'}
                  </span>
                </label>
                <input
                  type="range"
                  name={control.name}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={controls[control.name] || 1.0}
                  onChange={(e) => handleSliderChange(control.name, e.target.value)}
                  disabled={disabled}
                />
                <div className="slider-markers">
                  <span>Min</span>
                  <span>Neutral</span>
                  <span>Max</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        .controls-panel {
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .panel-header {
          padding: 10px;
          background: var(--secondary-gray);
          border-bottom: 2px solid var(--border-dark);
        }

        .panel-header h3 {
          margin: 0;
          font-size: 12px;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .disabled-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(236, 233, 216, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          text-align: center;
          padding: 20px;
        }

        .disabled-overlay p {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .control-group {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--border-dark);
        }

        .control-group:last-child {
          border-bottom: none;
        }

        .control-group h4 {
          margin: 0 0 10px 0;
          font-size: 11px;
          color: var(--primary-blue);
          text-transform: uppercase;
        }

        .control-item {
          margin-bottom: 15px;
        }

        .control-item label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
          font-size: 11px;
        }

        .control-value {
          font-weight: bold;
          color: var(--primary-blue);
        }

        .control-item input[type="range"] {
          width: 100%;
          height: 20px;
          border: 2px solid;
          border-color: var(--border-dark) var(--border-light) var(--border-light) var(--border-dark);
          background: var(--secondary-gray);
          appearance: none;
          -webkit-appearance: none;
        }

        .control-item input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 12px;
          height: 18px;
          background: var(--secondary-gray);
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          cursor: pointer;
        }

        .control-item input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 18px;
          background: var(--secondary-gray);
          border: 2px solid;
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          cursor: pointer;
        }

        .control-item input[type="range"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .slider-markers {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}