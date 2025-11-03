"use client";

import { GoogleButton } from "@/components/buttons/oauth/google";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";

const SignInForm = () => {
  const { signInForm, handleSignIn, isLoading, handleSignInWithGoogle } =
    useAuth();

  const { handleSubmit } = signInForm;

  return (
    <form
      id="sign-in-form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit(handleSignIn);
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Welcome Back!</FieldLegend>
          <FieldDescription className="">
            Please enter your email and password to sign in to your account.
          </FieldDescription>

          <Field>
            <GoogleButton
              handler={handleSignInWithGoogle}
              label="Continue with Google"
            />
          </Field>

          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
            Or continue with
          </FieldSeparator>

          <signInForm.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="email"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="m@example.com"
                    required
                    type="email"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </signInForm.Field>

          <signInForm.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    aria-invalid={isInvalid}
                    autoComplete="current-password"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="********"
                    required
                    type="password"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </signInForm.Field>
          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? (
              <>
                <Spinner />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </FieldSet>
      </FieldGroup>
    </form>
  );
};

export { SignInForm };
