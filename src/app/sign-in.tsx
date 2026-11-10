import { useState } from 'react';

import { FormError, FormScreen } from '@/components/form-screen';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim().toLowerCase();

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: trimmedEmail });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCode('');
    setCodeSent(true);
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    // On success the auth listener moves the parent on to the next screen.
    if (error) setError(error.message);
  }

  if (!codeSent) {
    return (
      <FormScreen title="Sign in" intro="We'll email you a code. No password needed.">
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={() => trimmedEmail.includes('@') && sendCode()}
        />
        <FormError message={error} />
        <Button
          title="Email me a code"
          onPress={sendCode}
          busy={busy}
          disabled={!trimmedEmail.includes('@')}
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen title="Enter your code" intro={`We sent a code to ${trimmedEmail}.`}>
      <TextField
        label="Code"
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={10}
        returnKeyType="done"
        onSubmitEditing={() => code.length >= 6 && verifyCode()}
      />
      <FormError message={error} />
      <Button title="Sign in" onPress={verifyCode} busy={busy} disabled={code.length < 6} />
      <Button title="Send a new code" variant="secondary" onPress={sendCode} disabled={busy} />
      <Button
        title="Use a different email"
        variant="secondary"
        onPress={() => {
          setCodeSent(false);
          setError(null);
        }}
        disabled={busy}
      />
    </FormScreen>
  );
}
