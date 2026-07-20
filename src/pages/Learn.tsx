import { AlertTriangle, BookOpen, HelpCircle, Lock, Shield, Zap } from 'lucide-react';
import diagram from '@/assets/diagram.svg';

const Learn = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <div className="section-eyebrow flex items-center gap-1.5">
          <BookOpen className="h-3 w-3" /> Learn
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Understanding Bitcoin Will</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          TIP (Time-Locked Inheritance Protocol) defines the inheritance pattern, and Bitcoin Will provides a non-custodial implementation you can use in practice.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-foreground/70" /> Two spending paths
        </h2>
        <div className="panel flex justify-center p-6">
          <img src={diagram} alt="Logic flow" className="h-auto max-w-full" loading="lazy" />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          The vault address protects your Bitcoin with a branching rule.
        </p>
      </section>

      <section className="space-y-2">
        <div className="section-eyebrow flex items-center gap-1.5">
          <Shield className="h-3 w-3" /> What it is NOT
        </div>
        <div className="panel p-5">
          <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground/80">
            <li><strong className="font-semibold">Not a wallet:</strong> we do not store your Bitcoin. Standard vaults use public keys only; optional social recovery generates a beneficiary key in your browser only.</li>
            <li><strong className="font-semibold">Not custody:</strong> no one but you (and eventually your heir) has access to the funds.</li>
            <li><strong className="font-semibold">Not legal advice:</strong> this is a technical tool. Consult a lawyer for estate planning.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <div className="section-eyebrow flex items-center gap-1.5">
          <Lock className="h-3 w-3" /> The basic idea
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">
          You deposit Bitcoin into a special "vault address." This address has a built-in rule: <strong className="font-semibold">you</strong> can move the money whenever you want. However, if you don't move the money for a set period (the "timelock"), your <strong className="font-semibold">beneficiary</strong> gains the right to claim it.
        </p>
      </section>

      <section className="space-y-2">
        <div className="section-eyebrow flex items-center gap-1.5">
          <HelpCircle className="h-3 w-3" /> How the timelock works
        </div>
        <div className="space-y-2 text-sm text-foreground/80">
          <p>
            We use a Bitcoin feature called <code>CheckSequenceVerify</code> (CSV). This is a "relative timelock."
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>The timer starts <strong className="font-semibold">after</strong> your funding transaction is confirmed.</li>
            <li>Timing is based on <strong className="font-semibold">blocks</strong>, not seconds. Bitcoin produces a block roughly every ten minutes.</li>
            <li>To "reset" the timer, you simply move your funds to a new vault.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <div className="section-eyebrow flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3" /> Critical safety checklist
        </div>
        <div className="panel p-5 space-y-2">
          <h4 className="text-sm font-semibold">What you MUST keep safe</h4>
          <ul className="list-decimal list-inside space-y-1.5 text-sm text-foreground/80">
            <li><strong className="font-semibold">Your private key:</strong> without your key, you can't reset the timer.</li>
            <li><strong className="font-semibold">The recovery kit:</strong> your heir needs the JSON file (the kit) AND their own private key to claim.</li>
            <li><strong className="font-semibold">Heir's key:</strong> the beneficiary must keep their key safe for years.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Frequently asked</h3>
        <dl className="space-y-4 text-sm">
          <div className="space-y-1">
            <dt className="font-semibold text-foreground">Can you recover my funds if I lose my keys?</dt>
            <dd className="text-muted-foreground">No. We have zero access. If you lose your keys, the math ensures the funds are gone forever.</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold text-foreground">Does this app send my Bitcoin?</dt>
            <dd className="text-muted-foreground">No. We only generate the address and the script. You use your own wallet (like Sparrow or Electrum) to send the funds.</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold text-foreground">Can I change the delay later?</dt>
            <dd className="text-muted-foreground">Yes, but only by moving the funds to a new vault address with a different delay setting.</dd>
          </div>
          <div className="space-y-1">
            <dt className="font-semibold text-foreground">How does the beneficiary actually claim?</dt>
            <dd className="leading-relaxed text-muted-foreground">
              They use an advanced Bitcoin wallet (like Sparrow Wallet) to provide their signature and the witness script generated by this app. The network verifies that the required time has passed since the funds were deposited and, if valid, allows the beneficiary to move the funds to their own address.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="border-t border-border pt-4">
        <button type="button" onClick={onBack} className="btn-accent">
          Got it, let's go
        </button>
      </footer>
    </div>
  );
};

export default Learn;
