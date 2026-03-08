import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FeedbackForm from '@/components/FeedbackForm';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Feedback = () => {
  const { user } = useAuth();

  return (
    <Header>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-foreground text-xl">Provide Feedback</CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Help us improve AI-MCQs Point
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <FeedbackForm />
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">
                  Please sign in to submit feedback
                </p>
                <Button asChild>
                  <Link to="/signin">Sign In</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default Feedback;
