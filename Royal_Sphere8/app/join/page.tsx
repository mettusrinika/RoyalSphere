"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useState } from "react"

const JoinPage = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    acceptTerms: false,
    // ... other form data fields ...
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission logic here
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Submit application logic here
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  return (
    // ... existing code through form ...
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-8 animate-fade-in">
      {/* Step 1: Business Info */}
      {step === 1 && <div className="space-y-6 animate-slide-up">{/* ... existing step 1 content ... */}</div>}

      {/* Step 2: Personal & Professional Info */}
      {step === 2 && <div className="space-y-6 animate-slide-up">{/* ... existing step 2 content ... */}</div>}

      {/* Step 3: Portfolio & Verification */}
      {step === 3 && <div className="space-y-6 animate-slide-up">{/* ... existing step 3 content ... */}</div>}

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8 pt-8 border-t border-border animate-fade-in">
        {step > 1 && (
          <Button
            type="button"
            onClick={handleBack}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10 bg-transparent -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
          >
            Back
          </Button>
        )}
        <Button
          type="submit"
          disabled={step === 3 && !formData.acceptTerms}
          className="flex-1 bg-primary hover:bg-primary/90 text-white h-12 flex items-center justify-center gap-2 -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          {step < 3 ? (
            <>
              Next <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </form>
  )
}

export default JoinPage
