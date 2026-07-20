import { AlertCircle, CheckCircle, Clock, Cpu, FileCode, HelpCircle, Lock, Shield, XCircle, Zap } from 'lucide-react';
import diagram from '@/assets/diagram.svg';

interface ProtocolProps {
  onBack: () => void;
  onOpenWhitepaper: () => void;
}

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
      <Icon className="h-4 w-4 text-foreground/70" />
      {title}
    </h2>
    <div className="space-y-2 text-sm leading-relaxed text-foreground/80">{children}</div>
  </section>
);

const Protocol = ({ onBack: _onBack, onOpenWhitepaper }: ProtocolProps) => {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <div className="section-eyebrow flex items-center gap-1.5">
          <Cpu className="h-3 w-3" /> Protocol
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Protocol specification</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A transparent look at TIP and how Bitcoin Will implements it.
        </p>
      </header>

      <Section icon={HelpCircle} title="What is TIP?">
        <p>
          TIP stands for <strong className="font-semibold">Time-Locked Inheritance Protocol</strong>. It is a Bitcoin-native way to plan inheritance using Bitcoin timelocks and spending conditions.
        </p>
        <p>TIP is not a new blockchain. It is not a token. It is not a company or custody service.</p>
        <p>
          TIP is a practical pattern for creating a future spending plan that can only be executed after a chosen time, using Bitcoin's existing script capabilities.
        </p>
      </Section>

      <Section icon={Clock} title="Why TIP exists">
        <p>Bitcoin is unforgiving. If a person dies or becomes unable to access their keys, Bitcoin can be lost forever.</p>
        <p>
          Most inheritance solutions add a trusted third party — a custodian, account system, or company holding secrets. That introduces new risks.
        </p>
        <p>TIP exists to provide a trust-minimized option: a way to plan ahead while keeping control in the hands of the Bitcoin owner.</p>
      </Section>

      <Section icon={Shield} title="How TIP works (high level)">
        <p>
          TIP uses relative timelocks (CSV) to create a spending path that is not valid until a chosen number of blocks has elapsed since funding confirmation.
        </p>

        <div className="panel mt-3 p-5">
          <ol className="space-y-3">
            {[
              'You choose a timeline and beneficiaries or a recovery plan.',
              'Bitcoin Will generates a TIP spending plan and script conditions.',
              'Funds are arranged so they can only be moved according to that plan.',
              'Before the timelock expires, the future-spend path is not valid.',
              'After the timelock expires, the future-spend path becomes valid and can be used.',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold text-foreground">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground/80">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          All rules are enforced by the Bitcoin network itself. Bitcoin Will is not trusted.
        </div>
      </Section>

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Zap className="h-4 w-4 text-foreground/70" /> Technical implementation
        </h2>

        <div>
          <h3 className="text-sm font-semibold">Logic flow</h3>
          <div className="panel mt-2 flex justify-center p-6">
            <img src={diagram} alt="Bitcoin Will logic diagram" className="h-auto max-w-full" loading="lazy" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="panel p-5 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileCode className="h-4 w-4 text-foreground/70" /> The script
            </h3>
            <pre className="overflow-x-auto rounded-md bg-muted/60 p-3 font-mono text-[11px] leading-relaxed text-foreground">
{`OP_IF
  <owner_pubkey> OP_CHECKSIG
OP_ELSE
  <locktime_blocks> OP_CHECKSEQUENCEVERIFY
  OP_DROP
  <beneficiary_pubkey> OP_CHECKSIG
OP_ENDIF`}
            </pre>
            <p className="text-xs text-muted-foreground">
              Compatible with SegWit P2WSH (v0) and Taproot (P2TR) outputs.
            </p>
          </div>

          <div className="panel p-5 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-foreground/70" /> Security properties
            </h3>
            <ul className="space-y-1.5 text-sm text-foreground/80">
              <li>• <strong className="font-semibold">Non-custodial:</strong> no server holds keys; standard vaults use pubkeys only (SSS may generate a beneficiary key locally).</li>
              <li>• <strong className="font-semibold">Stateless:</strong> no user data stored on any server.</li>
              <li>• <strong className="font-semibold">Deterministic:</strong> fixed inputs yield a fixed, auditable output.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="panel p-5 space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="h-4 w-4 text-success" /> What Bitcoin Will does
          </h3>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            {[
              'Generates TIP-compatible Bitcoin scripts and a readable spending plan',
              'Helps users choose time parameters and understand tradeoffs',
              'Runs locally in the browser',
              'Does not require an account',
              'Does not store user data on any server',
              'Does not upload private keys (SSS keygen stays local)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5 space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <XCircle className="h-4 w-4 text-danger" /> What it does NOT do
          </h3>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            {[
              'Act as a wallet',
              'Act as a custodian',
              'Act as a legal will',
              'Monitor whether someone is alive',
              'Guarantee against user error',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-danger" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel p-5 space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-foreground/70" /> Security model
        </h3>
        <p className="text-sm text-foreground/80">Bitcoin Will is designed to minimize trust and data exposure.</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Core properties</p>
        <ul className="space-y-1.5 text-sm text-foreground/80">
          {[
            'No server-side plan storage (session drafts may be cached locally in your browser)',
            'Client-side only',
            'Outputs are inspectable and verifiable',
            'Open-source and reviewable',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Section icon={AlertCircle} title="Key limitations">
        <p><strong className="font-semibold">No monitoring:</strong> the app does not watch the blockchain for you. Your heir must use the recovery kit manually.</p>
        <p><strong className="font-semibold">Not a legal will:</strong> this is a technical primitive. It does not replace legal inheritance laws.</p>
        <p><strong className="font-semibold">Irreversibility:</strong> Bitcoin scripts are final. Test with small amounts on Testnet first.</p>
      </Section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>TIP Protocol v1.0.0 · Last updated Feb 2026</p>
        <button
          type="button"
          onClick={onOpenWhitepaper}
          className="text-foreground underline underline-offset-2 hover:text-foreground/70"
        >
          Read the whitepaper →
        </button>
      </footer>
    </div>
  );
};

export default Protocol;
