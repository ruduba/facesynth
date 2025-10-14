import { useState } from 'react';

export default function TutorialModal({ onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to FaceSynth.exe',
      content: 'Create and edit 3D facial meshes with real-time camera tracking and powerful sculpting tools.',
      icon: '👋'
    },
    {
      title: 'Camera Permission',
      content: 'Grant camera access to capture your facial landmarks. This creates a baseline mesh you can customize with sliders and sculpting tools.',
      icon: '📷'
    },
    {
      title: 'Edit and Export',
      content: 'Use character-creator style sliders to adjust features, sculpt with brush tools, and export your mesh as STL, OBJ, or PLY for 3D printing.',
      icon: '🎨'
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content tutorial-modal">
        <div className="tutorial-icon">{currentStep.icon}</div>
        
        <h2 className="tutorial-title">{currentStep.title}</h2>
        <p className="tutorial-text">{currentStep.content}</p>

        <div className="tutorial-progress">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-actions">
          <button className="btn-secondary" onClick={handleSkip}>
            Skip Tutorial
          </button>
          <button className="btn-primary" onClick={handleNext}>
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}