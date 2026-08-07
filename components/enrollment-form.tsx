"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronRight, MapPin, Clock, User, CreditCard, Package } from "lucide-react"
import { SignaturePad } from "@/components/signature-pad"

// Club data
const clubs = [
  { id: "pretoria", name: "Padel Club Pretoria", location: "Pretoria, Gauteng" },
  { id: "johannesburg", name: "Johannesburg Padel Centre", location: "Johannesburg, Gauteng" },
  { id: "capetown", name: "Cape Town Padel Hub", location: "Cape Town, Western Cape" },
]

// Package data
const packages = [
  {
    id: "beginner",
    name: "Beginner Development Package",
    price: 600,
    sessions: 4,
    description: "Perfect for new players learning the basics",
    features: ["4 coaching sessions per month", "Balls, rental racket and court fees included in each session", "Basic technique training"],
    popular: true,
  },
  {
    id: "advanced",
    name: "Advanced Development Package",
    price: 900,
    sessions: 8,
    description: "For players ready to take their game to the next level",
    features: ["8 coaching sessions per month", "Balls, rental racket and court fees included in each session", "Advanced technique training", "Match play opportunities"],
    popular: false,
  },
]

// Age groups with their time slots
const ageGroups = [
  {
    id: "5-8",
    label: "Ages 5-8",
    description: "Young beginners",
    timeSlots: ["10:00", "11:00", "12:00", "13:00"],
  },
  {
    id: "9-13",
    label: "Ages 9-13",
    description: "Junior development",
    timeSlots: ["10:00", "11:00", "12:00", "13:00", "14:00"],
  },
  {
    id: "14-17",
    label: "Ages 14-17",
    description: "Teen advanced",
    timeSlots: ["15:00"],
  },
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

// Simulated slot availability (in real app, this would come from database)
const getSlotAvailability = (clubId: string, ageGroup: string, day: string, time: string) => {
  // Simulate random availability between 0-8
  const seed = `${clubId}-${ageGroup}-${day}-${time}`.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return Math.max(0, 8 - (seed % 9))
}

// Terms and conditions content
const termsContent = `NEXTGEN PADEL ACADEMY
Full Terms, Conditions and Indemnity

1. Introduction
This document forms part of the Academy's binding terms and indemnity agreement between NextGen Padel Academy and the participant/guardian.

2. Definitions
"Academy" refers to NextGen Padel Academy. "Participant" refers to the child enrolled in the program. "Guardian" refers to the parent or legal guardian signing this agreement.

3. Eligibility
Participants must be between 5-18 years of age. All participants must have parental/guardian consent to participate.

4. Membership and Subscription Fees
- Beginner Package: R600 per month (4 sessions)
- Advanced Package: R900 per month (8 sessions)
- Fees are due at the beginning of each month
- No refunds for missed sessions unless cancelled 24 hours in advance

5. Health and Medical Disclosure
Parents/guardians must disclose any medical conditions, allergies, or physical limitations that may affect the participant's ability to safely participate in padel activities.

6. Emergency Medical Treatment
In case of emergency, the Academy is authorized to seek medical treatment for the participant. Parents/guardians will be contacted immediately.

7. Assumption of Risk
Padel is a physical sport that carries inherent risks of injury. By enrolling, you acknowledge and accept these risks.

8. Indemnity and Release of Liability
The Academy, its coaches, and staff are not liable for any injuries, accidents, or damages that may occur during sessions, except in cases of gross negligence.

9. Loss or Damage to Property
The Academy is not responsible for loss or damage to personal property brought to the premises.

10. Transportation
Parents/guardians are responsible for transportation to and from the Academy.

11. Behaviour and Discipline
Participants are expected to behave respectfully. The Academy reserves the right to suspend or terminate membership for misconduct.

12. Weather and Force Majeure
Sessions may be cancelled due to adverse weather or unforeseen circumstances. Make-up sessions will be arranged.

13. Photography, Video and Media
The Academy may photograph or video participants for promotional purposes. Consent can be withdrawn in writing.

14. POPIA Consent
Personal information is collected and processed in accordance with POPIA regulations.

15. Cancellation of Membership
30 days written notice is required for cancellation. No refunds for partial months.

16. Governing Law
This agreement is governed by the laws of South Africa.

17. Acknowledgement
By signing below, you confirm that you have read, understood, and agree to all terms and conditions.

18. CPA Section 49 Notice
This agreement contains important terms that may limit our liability and impose obligations on you.`

interface FormData {
  // Entry: package deal
  selectedPackage: string
  // Step 1: Club
  selectedClub: string
  // Step 2: Age group & time
  selectedAgeGroup: string
  selectedDay: string
  selectedTime: string
  // Step 3: Sign up
  guardianFirstName: string
  guardianLastName: string
  guardianEmail: string
  guardianPhone: string
  guardianIdNumber: string
  guardianSignature: string
  childFirstName: string
  childLastName: string
  childDateOfBirth: string
  childAge: string
  medicalConditions: string
  allergies: string
  emergencyContact: string
  emergencyPhone: string
  acceptTerms: boolean
  acceptMedia: boolean
}

const initialFormData: FormData = {
  selectedPackage: "",
  selectedClub: "",
  selectedAgeGroup: "",
  selectedDay: "",
  selectedTime: "",
  guardianFirstName: "",
  guardianLastName: "",
  guardianEmail: "",
  guardianPhone: "",
  guardianIdNumber: "",
  guardianSignature: "",
  childFirstName: "",
  childLastName: "",
  childDateOfBirth: "",
  childAge: "",
  medicalConditions: "",
  allergies: "",
  emergencyContact: "",
  emergencyPhone: "",
  acceptTerms: false,
  acceptMedia: false,
}

export function EnrollmentForm() {
  const searchParams = useSearchParams()
  const packageFromUrl = searchParams.get("package")

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Pre-select package from URL (e.g. when arriving from a package card link)
  useEffect(() => {
    if (packageFromUrl && (packageFromUrl === "beginner" || packageFromUrl === "advanced")) {
      setFormData(prev => ({ ...prev, selectedPackage: packageFromUrl }))
    }
  }, [packageFromUrl])

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectPackage = (packageId: string) => {
    setFormData(prev => ({ ...prev, selectedPackage: packageId }))
    setStep(1)
  }

  const canProceedStep1 = formData.selectedClub !== ""
  const canProceedStep2 = formData.selectedAgeGroup !== "" && formData.selectedDay !== "" && formData.selectedTime !== ""
  const canProceedStep3 =
    formData.guardianFirstName !== "" &&
    formData.guardianLastName !== "" &&
    formData.guardianEmail !== "" &&
    formData.guardianPhone !== "" &&
    formData.guardianIdNumber !== "" &&
    formData.guardianSignature !== "" &&
    formData.childFirstName !== "" &&
    formData.childLastName !== "" &&
    formData.childDateOfBirth !== "" &&
    formData.acceptTerms

  const selectedClubData = clubs.find(c => c.id === formData.selectedClub)
  const selectedAgeGroupData = ageGroups.find(a => a.id === formData.selectedAgeGroup)
  const selectedPackageData = packages.find(p => p.id === formData.selectedPackage)

  const handlePayment = async () => {
    setIsSubmitting(true)

    try {
      const enrollmentData = {
        club: selectedClubData?.name,
        package: selectedPackageData?.name,
        packagePrice: selectedPackageData?.price,
        ageGroup: selectedAgeGroupData?.label,
        day: formData.selectedDay,
        time: formData.selectedTime,
        guardian: {
          firstName: formData.guardianFirstName,
          lastName: formData.guardianLastName,
          email: formData.guardianEmail,
          phone: formData.guardianPhone,
          idNumber: formData.guardianIdNumber,
          signature: formData.guardianSignature,
        },
        child: {
          firstName: formData.childFirstName,
          lastName: formData.childLastName,
          dateOfBirth: formData.childDateOfBirth,
          medicalConditions: formData.medicalConditions,
        },
        enrolledAt: new Date().toISOString(),
      }

      console.log("[v0] Enrollment submitted:", enrollmentData)

      await new Promise(resolve => setTimeout(resolve, 1500))

      setIsComplete(true)
    } catch (error) {
      console.error("[v0] Payment error:", error)
      alert("There was an error processing your payment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Completion screen
  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="size-20 rounded-full bg-secondary mx-auto flex items-center justify-center mb-6">
            <Check className="size-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">Enrollment Complete!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for enrolling {formData.childFirstName} at Next Gen Padel Academy.
            A confirmation email has been sent to {formData.guardianEmail}.
          </p>
          <div className="bg-muted rounded-lg p-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Booking Details:</h3>
            <p><strong>Package:</strong> {selectedPackageData?.name}</p>
            <p><strong>Club:</strong> {selectedClubData?.name}</p>
            <p><strong>Age Group:</strong> {selectedAgeGroupData?.label}</p>
            <p><strong>Day:</strong> {formData.selectedDay}</p>
            <p><strong>Time:</strong> {formData.selectedTime}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Entry screen: package deal selection. This is the ONLY way to begin enrollment.
  if (!formData.selectedPackage) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-primary mb-2">
            Choose a Monthly Package to Begin
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select one of our monthly package deals below to start your enrollment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => selectPackage(pkg.id)}
              className={`text-left p-6 rounded-xl border-2 cursor-pointer transition-all relative hover:scale-[1.02] hover:shadow-lg ${
                pkg.popular ? "border-secondary shadow-md" : "border-border hover:border-secondary/50"
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-3 right-4 bg-secondary text-primary">
                  Most Popular
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Package className="size-5 text-secondary" />
                <h3 className="font-bold text-lg">{pkg.name}</h3>
              </div>
              <p className="text-3xl font-black text-primary mb-2">
                R{pkg.price}<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-muted-foreground mb-4">{pkg.description}</p>
              <ul className="flex flex-col gap-2 mb-6">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-secondary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1 bg-secondary text-primary font-bold py-2 px-6 rounded-lg">
                Select & Continue
                <ChevronRight className="size-4" />
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Selected package banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 rounded-xl bg-secondary/10 border border-secondary/30">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Selected Package</p>
            <p className="font-bold text-primary">
              {selectedPackageData?.name} — R{selectedPackageData?.price}/month
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFormData(prev => ({ ...prev, selectedPackage: "" }))
            setStep(1)
          }}
        >
          Change Package
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6 gap-1 md:gap-0">
        {[1, 2, 3, 4].map((s, i) => (
          <div key={s} className="flex items-center gap-1 md:gap-0">
            <div
              className={`size-8 md:size-10 rounded-full flex items-center justify-center font-bold text-xs md:text-base transition-colors ${
                step >= s
                  ? "bg-secondary text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="size-3 md:size-5" /> : s}
            </div>
            {i < 3 && (
              <div
                className={`w-2 md:w-12 h-1 transition-colors ${
                  step > s ? "bg-secondary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between mb-6 text-xs px-1">
        <span className={`${step >= 1 ? "text-secondary font-semibold" : "text-muted-foreground"}`}>
          Select Club
        </span>
        <span className={`${step >= 2 ? "text-secondary font-semibold" : "text-muted-foreground"}`}>
          Age & Time
        </span>
        <span className={`${step >= 3 ? "text-secondary font-semibold" : "text-muted-foreground"}`}>
          Sign Up
        </span>
        <span className={`${step >= 4 ? "text-secondary font-semibold" : "text-muted-foreground"}`}>
          Pay Now
        </span>
      </div>

      {/* Step 1: Select Club */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-secondary" />
              Step 1: Select Your Club
            </CardTitle>
            <CardDescription>
              Choose the affiliated club nearest to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {clubs.map((club) => (
                <div
                  key={club.id}
                  onClick={() => updateFormData("selectedClub", club.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.selectedClub === club.id
                      ? "border-secondary bg-secondary/10"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{club.name}</h3>
                      <p className="text-muted-foreground">{club.location}</p>
                    </div>
                    {formData.selectedClub === club.id && (
                      <div className="size-8 rounded-full bg-secondary flex items-center justify-center">
                        <Check className="size-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-secondary text-primary hover:bg-secondary/90"
              >
                Continue
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Age Group & Time */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-secondary" />
              Step 2: Select Age Group & Time Slot
            </CardTitle>
            <CardDescription>
              Choose the appropriate age group and available time slot (max 8 children per slot)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Age Group Selection */}
            <div className="mb-6">
              <Label className="text-base font-semibold mb-3 block">Age Group</Label>
              <div className="grid sm:grid-cols-3 gap-4">
                {ageGroups.map((age) => (
                  <div
                    key={age.id}
                    onClick={() => {
                      updateFormData("selectedAgeGroup", age.id)
                      updateFormData("selectedDay", "")
                      updateFormData("selectedTime", "")
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                      formData.selectedAgeGroup === age.id
                        ? "border-secondary bg-secondary/10"
                        : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <h3 className="font-bold text-lg">{age.label}</h3>
                    <p className="text-sm text-muted-foreground">{age.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Day & Time Selection */}
            {formData.selectedAgeGroup && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Day & Time</Label>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left border-b">Time</th>
                        {days.map(day => (
                          <th key={day} className="p-2 text-center border-b min-w-[100px]">
                            {day.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAgeGroupData?.timeSlots.map(time => (
                        <tr key={time}>
                          <td className="p-2 font-semibold border-b">{time}</td>
                          {days.map(day => {
                            const available = getSlotAvailability(
                              formData.selectedClub,
                              formData.selectedAgeGroup,
                              day,
                              time
                            )
                            const isSelected = formData.selectedDay === day && formData.selectedTime === time
                            const isFull = available === 0

                            return (
                              <td key={day} className="p-2 border-b">
                                <button
                                  onClick={() => {
                                    if (!isFull) {
                                      updateFormData("selectedDay", day)
                                      updateFormData("selectedTime", time)
                                    }
                                  }}
                                  disabled={isFull}
                                  className={`w-full p-2 rounded-lg text-sm transition-all ${
                                    isSelected
                                      ? "bg-secondary text-primary font-bold"
                                      : isFull
                                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                                      : "bg-muted/50 hover:bg-secondary/20"
                                  }`}
                                >
                                  {isFull ? "Full" : `${available} spots`}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {formData.selectedDay && formData.selectedTime && (
                  <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                    <p className="font-semibold">
                      Selected: <span className="text-secondary">{formData.selectedDay} at {formData.selectedTime}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="bg-secondary text-primary hover:bg-secondary/90"
              >
                Continue
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Sign Up Form */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-secondary" />
              Step 3: Registration Details
            </CardTitle>
            <CardDescription>
              Please provide guardian and child information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {/* Guardian Information */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary">Parent/Guardian Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guardianFirstName">First Name *</Label>
                    <Input
                      id="guardianFirstName"
                      value={formData.guardianFirstName}
                      onChange={(e) => updateFormData("guardianFirstName", e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianLastName">Last Name *</Label>
                    <Input
                      id="guardianLastName"
                      value={formData.guardianLastName}
                      onChange={(e) => updateFormData("guardianLastName", e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianEmail">Email *</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      value={formData.guardianEmail}
                      onChange={(e) => updateFormData("guardianEmail", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardianPhone">Phone Number *</Label>
                    <Input
                      id="guardianPhone"
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => updateFormData("guardianPhone", e.target.value)}
                      placeholder="084 123 4567"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="guardianIdNumber">ID Number *</Label>
                    <Input
                      id="guardianIdNumber"
                      value={formData.guardianIdNumber}
                      onChange={(e) => updateFormData("guardianIdNumber", e.target.value)}
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>
              </div>

              {/* Child Information */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary">Child Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="childFirstName">First Name *</Label>
                    <Input
                      id="childFirstName"
                      value={formData.childFirstName}
                      onChange={(e) => updateFormData("childFirstName", e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="childLastName">Last Name *</Label>
                    <Input
                      id="childLastName"
                      value={formData.childLastName}
                      onChange={(e) => updateFormData("childLastName", e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="childDateOfBirth">Date of Birth *</Label>
                    <Input
                      id="childDateOfBirth"
                      type="date"
                      value={formData.childDateOfBirth}
                      onChange={(e) => updateFormData("childDateOfBirth", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="childAge">Age</Label>
                    <Input
                      id="childAge"
                      value={formData.childAge}
                      onChange={(e) => updateFormData("childAge", e.target.value)}
                      placeholder="e.g., 8"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary">Medical Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Input
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => updateFormData("medicalConditions", e.target.value)}
                      placeholder="List any medical conditions (or write 'None')"
                    />
                  </div>
                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => updateFormData("allergies", e.target.value)}
                      placeholder="List any allergies (or write 'None')"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-primary">Emergency Contact</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => updateFormData("emergencyContact", e.target.value)}
                      placeholder="Enter emergency contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => updateFormData("emergencyPhone", e.target.value)}
                      placeholder="084 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4 text-primary">Terms and Conditions</h3>
                <ScrollArea className="h-48 mb-4 border rounded-lg p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                    {termsContent}
                  </pre>
                </ScrollArea>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => updateFormData("acceptTerms", checked === true)}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                      I have read and agree to the Terms, Conditions, and Indemnity Agreement.
                      I understand the risks involved and release the Academy from liability. *
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptMedia"
                      checked={formData.acceptMedia}
                      onCheckedChange={(checked) => updateFormData("acceptMedia", checked === true)}
                    />
                    <Label htmlFor="acceptMedia" className="text-sm leading-relaxed cursor-pointer">
                      I consent to photographs and videos of my child being used for promotional purposes.
                    </Label>
                  </div>

                  <div className="mt-2">
                    <Label htmlFor="guardianSignature">
                      Parent/Guardian Signature *
                    </Label>
                    <SignaturePad
                      value={formData.guardianSignature}
                      onChange={(value) => updateFormData("guardianSignature", value)}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Please sign above to confirm you are the parent/legal guardian and accept these terms on behalf of the child.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="bg-secondary text-primary hover:bg-secondary/90"
              >
                Continue to Payment
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-secondary" />
              Step 4: Pay Now
            </CardTitle>
            <CardDescription>
              Review your booking and complete payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Booking Summary */}
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
              <div className="grid gap-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package:</span>
                  <span className="font-medium">{selectedPackageData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="font-medium">{selectedPackageData?.sessions} per month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Club:</span>
                  <span className="font-medium">{selectedClubData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age Group:</span>
                  <span className="font-medium">{selectedAgeGroupData?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-medium">{formData.selectedDay} at {formData.selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participant:</span>
                  <span className="font-medium">{formData.childFirstName} {formData.childLastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guardian:</span>
                  <span className="font-medium">{formData.guardianFirstName} {formData.guardianLastName}</span>
                </div>
              </div>
            </div>

            {/* Selected Package Details */}
            <div className="mb-6 p-6 rounded-xl border-2 border-secondary bg-secondary/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-lg">{selectedPackageData?.name}</h4>
                <Badge className="bg-secondary text-primary">Selected</Badge>
              </div>
              <p className="text-3xl font-black text-primary mb-2">
                R{selectedPackageData?.price}<span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="mt-4 space-y-2">
                {selectedPackageData?.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-secondary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Total */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Due Today:</span>
                <span className="text-secondary">R{selectedPackageData?.price}.00</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                First month payment - recurring monthly
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isSubmitting}
                className="bg-secondary text-primary hover:bg-secondary/90 min-w-[150px]"
              >
                {isSubmitting ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
