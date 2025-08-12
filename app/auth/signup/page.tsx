'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
  'Geography', 'Computer Science', 'Economics', 'Psychology', 'Philosophy',
  'French', 'Spanish', 'German', 'Art', 'Music', 'Business Studies'
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = searchParams.get('type') || 'student';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: accountType,
    biography: '',
    subjects: [] as string[],
    qualifications: [] as string[],
    hourlyRate: '',
    location: '',
    availability: {} as { [key: string]: string[] },
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [newQualification, setNewQualification] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, newQualification.trim()]
      }));
      setNewQualification('');
    }
  };

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const handleAvailabilityToggle = (day: string, timeSlot: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: prev.availability[day]?.includes(timeSlot)
          ? prev.availability[day].filter(slot => slot !== timeSlot)
          : [...(prev.availability[day] || []), timeSlot]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.type === 'tutor') {
      if (formData.subjects.length === 0) {
        toast.error('Please select at least one subject');
        return;
      }
      if (!formData.hourlyRate) {
        toast.error('Please enter your hourly rate');
        return;
      }
    }

    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      let profilePictureUrl = '';
      
      if (profileImage) {
        const imageRef = ref(storage, `profile-pictures/${userCredential.user.uid}`);
        await uploadBytes(imageRef, profileImage);
        profilePictureUrl = await getDownloadURL(imageRef);
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        type: formData.type,
        profilePicture: profilePictureUrl,
        createdAt: new Date().toISOString(),
        ...(formData.type === 'tutor' && {
          biography: formData.biography,
          subjects: formData.subjects,
          qualifications: formData.qualifications,
          hourlyRate: parseFloat(formData.hourlyRate),
          location: formData.location,
          availability: formData.availability,
          rating: 0,
          totalReviews: 0,
          totalLessons: 0,
        })
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      toast.success('Account created successfully!');
      router.push(`/dashboard/${formData.type}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-2xl card-sharp">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-bold text-gradient">TutorConnect</span>
          </div>
          <CardTitle className="text-3xl font-bold text-text-primary">
            Sign Up as {formData.type === 'student' ? 'a Student' : 'a Tutor'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Type Selector */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={formData.type === 'student' ? 'default' : 'outline'}
                onClick={() => handleInputChange('type', 'student')}
                className="flex-1"
              >
                Student
              </Button>
              <Button
                type="button"
                variant={formData.type === 'tutor' ? 'default' : 'outline'}
                onClick={() => handleInputChange('type', 'tutor')}
                className="flex-1"
              >
                Tutor
              </Button>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Profile Picture */}
            <div>
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <div className="mt-2">
                <Input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                />
                {profileImage && (
                  <p className="text-sm text-text-secondary mt-2">
                    Selected: {profileImage.name}
                  </p>
                )}
              </div>
            </div>

            {/* Tutor-specific fields */}
            {formData.type === 'tutor' && (
              <>
                <div>
                  <Label htmlFor="biography">Biography</Label>
                  <Textarea
                    id="biography"
                    value={formData.biography}
                    onChange={(e) => handleInputChange('biography', e.target.value)}
                    placeholder="Tell students about yourself, your teaching experience, and approach..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label>Subjects You Teach</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {subjects.map(subject => (
                      <div key={subject} className="flex items-center space-x-2">
                        <Checkbox
                          id={subject}
                          checked={formData.subjects.includes(subject)}
                          onCheckedChange={() => handleSubjectToggle(subject)}
                        />
                        <Label htmlFor={subject} className="text-sm">
                          {subject}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Qualifications</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      placeholder="Add a qualification..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                    />
                    <Button type="button" onClick={addQualification}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.qualifications.map((qual, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {qual}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeQualification(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="10"
                      step="5"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      placeholder="25"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <Label>Availability</Label>
                  <div className="mt-2 space-y-4">
                    {days.map(day => (
                      <div key={day}>
                        <h4 className="font-medium text-sm mb-2">{day}</h4>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {timeSlots.map(slot => (
                            <div key={`${day}-${slot}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${day}-${slot}`}
                                checked={formData.availability[day]?.includes(slot) || false}
                                onCheckedChange={() => handleAvailabilityToggle(day, slot)}
                              />
                              <Label htmlFor={`${day}-${slot}`} className="text-xs">
                                {slot}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-text-secondary">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}