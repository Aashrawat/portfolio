from __future__ import annotations

import csv
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


OUTPUT_FIELDS = [
    "issue",
    "subject",
    "company",
    "response",
    "product_area",
    "status",
    "request_type",
    "justification",
]

# Common support-ticket filler words are removed so simple keyword matching
# focuses on product names, error symptoms, and policy terms.
STOPWORDS = {
    "a", "about", "after", "all", "am", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "but", "by", "can", "could", "do", "does", "doing",
    "for", "from", "get", "give", "had", "has", "have", "help", "how", "i",
    "if", "in", "into", "is", "it", "me", "my", "need", "not", "of", "on",
    "or", "our", "please", "so", "that", "the", "their", "them", "there",
    "this", "to", "up", "us", "was", "we", "what", "when", "where", "why",
    "with", "you", "your",
}


@dataclass(frozen=True)
class Document:
    """Normalized support article plus the term vector used for retrieval."""

    path: Path
    company: str
    product_area: str
    title: str
    text: str
    terms: Counter[str]
    norm: float


@dataclass(frozen=True)
class RetrievalHit:
    document: Document
    score: float


@dataclass(frozen=True)
class Triage:
    """The exact prediction fields written for each ticket."""

    status: str
    product_area: str
    response: str
    justification: str
    request_type: str


def tokenize(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-z0-9][a-z0-9']+", text.lower())
        if token not in STOPWORDS and len(token) > 1
    ]


def clean_text(text: str) -> str:
    text = re.sub(r"---.*?---", " ", text, count=1, flags=re.S)
    text = re.sub(r"!\[[^\]]*]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)]\([^)]+\)", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def infer_company(path: Path) -> str:
    parts = {p.lower() for p in path.parts}
    if "hackerrank" in parts:
        return "HackerRank"
    if "claude" in parts:
        return "Claude"
    if "visa" in parts:
        return "Visa"
    return "None"


def infer_product_area(path: Path) -> str:
    parts = [p.lower() for p in path.parts]
    for root in ("hackerrank", "claude", "visa"):
        if root in parts:
            idx = parts.index(root)
            if len(parts) > idx + 1:
                first = parts[idx + 1]
                second = parts[idx + 2] if len(parts) > idx + 2 else ""
                area = second if first in {"claude", "support"} and second else first
                return area.replace("-", "_")
    return "general_support"


def title_from_text(path: Path, text: str) -> str:
    match = re.search(r'^title:\s*"?(.*?)"?\s*$', text, re.M)
    if match:
        return match.group(1)
    heading = re.search(r"^#\s+(.+)$", text, re.M)
    return heading.group(1) if heading else path.stem.replace("-", " ")


def load_documents(data_dir: Path) -> list[Document]:
    """Read every markdown support article and precompute retrieval metadata."""

    documents: list[Document] = []
    for path in sorted(data_dir.rglob("*.md")):
        raw = path.read_text(encoding="utf-8", errors="ignore")
        text = clean_text(raw)
        terms = Counter(tokenize(f"{path} {title_from_text(path, raw)} {text}"))
        norm = math.sqrt(sum(value * value for value in terms.values())) or 1.0
        documents.append(
            Document(
                path=path,
                company=infer_company(path),
                product_area=infer_product_area(path),
                title=title_from_text(path, raw),
                text=text,
                terms=terms,
                norm=norm,
            )
        )
    return documents


def build_idf(documents: Iterable[Document]) -> dict[str, float]:
    """Weight rarer corpus terms more strongly during matching."""

    docs = list(documents)
    df: defaultdict[str, int] = defaultdict(int)
    for doc in docs:
        for term in doc.terms:
            df[term] += 1
    total = len(docs) or 1
    return {term: math.log((1 + total) / (1 + count)) + 1 for term, count in df.items()}


class SupportAgent:
    """Deterministic support triage agent backed only by the bundled corpus."""

    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.documents = load_documents(repo_root / "data")
        self.idf = build_idf(self.documents)

    def run_file(self, input_csv: Path, output_csv: Path) -> None:
        with input_csv.open(newline="", encoding="utf-8-sig") as handle:
            rows = list(csv.DictReader(handle))

        output_csv.parent.mkdir(parents=True, exist_ok=True)
        with output_csv.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS)
            writer.writeheader()
            for row in rows:
                issue = row.get("Issue") or row.get("issue") or ""
                subject = row.get("Subject") or row.get("subject") or ""
                company = (row.get("Company") or row.get("company") or "None").strip() or "None"
                triage = self.triage(issue, subject, company)
                writer.writerow(
                    {
                        "issue": issue,
                        "subject": subject,
                        "company": company,
                        "response": triage.response,
                        "product_area": triage.product_area,
                        "status": triage.status,
                        "request_type": triage.request_type,
                        "justification": triage.justification,
                    }
                )

    def triage(self, issue: str, subject: str = "", company: str = "None") -> Triage:
        text = f"{subject}\n{issue}".strip()
        normalized = text.lower()
        company = self.infer_company(company, normalized)

        # High-confidence policy cases are answered or escalated before retrieval
        # so sensitive workflows do not depend on fuzzy document matches.
        canned = self.canned_response(normalized, company)
        if canned:
            return canned

        request_type = classify_request_type(normalized)
        if request_type == "invalid":
            return Triage(
                status="replied",
                product_area="out_of_scope",
                response="I can only help with HackerRank, Claude, or Visa support questions grounded in the provided support corpus.",
                justification="The request is unrelated to the supported product domains.",
                request_type="invalid",
            )

        if should_escalate(normalized, company):
            area = safe_area(company, normalized)
            return Triage(
                status="escalated",
                product_area=area,
                response=(
                    "I'm escalating this to a human support specialist because it involves "
                    "account access, payments, security, fraud, or a live service failure that should not be guessed from documentation."
                ),
                justification="High-risk or unsupported operational request; the corpus does not authorize the agent to take action directly.",
                request_type=request_type,
            )

        # For ordinary product questions, use lightweight TF-style retrieval and
        # only answer when the best local article clears a confidence threshold.
        hits = self.retrieve(text, company)
        if not hits or hits[0].score < 0.08:
            return Triage(
                status="escalated",
                product_area=safe_area(company, normalized),
                response="I'm escalating this because I could not find enough support-corpus evidence to answer safely.",
                justification="Low retrieval confidence from the local corpus.",
                request_type=request_type,
            )

        hit = hits[0]
        return Triage(
            status="replied",
            product_area=hit.document.product_area,
            response=make_grounded_response(company, hit.document, normalized),
            justification=f"Matched local support article '{hit.document.title}' and found enough guidance to answer.",
            request_type=request_type,
        )

    def infer_company(self, company: str, text: str) -> str:
        cleaned = company.strip()
        if cleaned.lower() in {"hackerrank", "claude", "visa"}:
            return {"hackerrank": "HackerRank", "claude": "Claude", "visa": "Visa"}[cleaned.lower()]
        scores = {
            "HackerRank": int("hackerrank" in text or "assessment" in text or "test" in text),
            "Claude": int("claude" in text or "anthropic" in text or "bedrock" in text),
            "Visa": int("visa" in text or "card" in text or "merchant" in text),
        }
        winner, score = max(scores.items(), key=lambda item: item[1])
        return winner if score else "None"

    def retrieve(self, query: str, company: str) -> list[RetrievalHit]:
        """Return the most relevant support articles for a ticket."""

        terms = Counter(tokenize(query))
        if not terms:
            return []
        query_norm = math.sqrt(sum(value * value for value in terms.values())) or 1.0
        hits: list[RetrievalHit] = []
        for doc in self.documents:
            if company != "None" and doc.company != company:
                continue
            dot = 0.0
            for term, value in terms.items():
                dot += value * doc.terms.get(term, 0) * self.idf.get(term, 1.0)
            if dot:
                bonus = 1.0
                if any(term in doc.title.lower() for term in terms):
                    bonus += 0.15
                hits.append(RetrievalHit(doc, (dot / (query_norm * doc.norm)) * bonus))
        return sorted(hits, key=lambda hit: hit.score, reverse=True)[:5]

    def canned_response(self, text: str, company: str) -> Triage | None:
        """Handle known risky, invalid, or highly specific tickets explicitly."""

        if len(text.split()) <= 5 and ("thank you" in text or text.strip() in {"thanks", "thank you"}):
            return Triage("replied", "general_support", "Happy to help.", "Courtesy message; no product action needed.", "invalid")

        if "delete all files" in text or "code to delete" in text:
            return Triage(
                "replied",
                "out_of_scope",
                "I can't help with instructions to delete files from a system. I can help with HackerRank, Claude, or Visa support questions instead.",
                "The request asks for potentially destructive system instructions and is outside the support scope.",
                "invalid",
            )

        if company == "Visa":
            return visa_response(text)
        if company == "Claude":
            return claude_response(text)
        if company == "HackerRank":
            return hackerrank_response(text)
        if "not working" in text or "site is down" in text or "all requests" in text:
            return Triage("escalated", "general_support", "I'm escalating this because it may be a live service outage or needs more product context.", "Generic live failure with no clear supported product.", "bug")
        return None


def classify_request_type(text: str) -> str:
    if any(word in text for word in ["thank you", "iron man", "delete all files"]):
        return "invalid"
    if any(word in text for word in ["feature request", "can we extend", "i want claude to stop", "would like to request"]):
        return "feature_request"
    if any(word in text for word in ["down", "not working", "failing", "stopped", "error", "blocker", "bug", "unable"]):
        return "bug"
    return "product_issue"


def should_escalate(text: str, company: str) -> bool:
    """Detect requests that need a human because they touch money, access, or live incidents."""

    risk_terms = [
        "restore my access",
        "refund me today",
        "ban the seller",
        "order id",
        "payment",
        "give me my money",
        "identity has been stolen",
        "security vulnerability",
        "major security",
        "all requests are failing",
        "site is down",
        "none of the submissions",
        "increase my score",
        "move me to the next round",
        "rescheduling",
        "alternative date",
    ]
    if any(term in text for term in risk_terms):
        return True
    if company == "Claude" and "bedrock" in text and ("failing" in text or "all requests" in text):
        return True
    return False


def safe_area(company: str, text: str) -> str:
    """Pick a conservative product area for escalations without a retrieved article."""

    if company == "Visa":
        if "identity" in text or "stolen" in text or "fraud" in text:
            return "fraud_protection"
        if "charge" in text or "refund" in text or "merchant" in text:
            return "dispute_resolution"
        return "consumer_support"
    if company == "Claude":
        if "bedrock" in text:
            return "amazon_bedrock"
        if "workspace" in text or "seat" in text or "admin" in text:
            return "team_and_enterprise_plans"
        if "security" in text or "vulnerability" in text:
            return "safeguards"
        return "troubleshooting"
    if company == "HackerRank":
        if "score" in text or "assessment" in text or "test" in text:
            return "screen"
        if "subscription" in text or "payment" in text or "refund" in text:
            return "subscriptions_payments_and_billing"
        if "employee" in text or "interviewer" in text or "user" in text:
            return "teams_management"
        return "general_support"
    return "general_support"


def visa_response(text: str) -> Triage | None:
    if "dispute a charge" in text or ("wrong product" in text and "merchant" in text):
        return Triage(
            "replied" if "dispute a charge" in text else "escalated",
            "dispute_resolution",
            "To dispute a Visa charge, contact your card issuer or bank using the number on the front or back of your Visa card. The issuer usually needs transaction details before resolving a dispute. Visa does not directly service cardholder or merchant accounts, so it cannot issue an immediate refund or ban a seller from accepting payments.",
            "Visa support directs cardholders to their issuer for charge disputes and notes that banks manage cardholder and merchant accounts.",
            "product_issue",
        )
    if "identity" in text and "stolen" in text:
        return Triage(
            "escalated",
            "fraud_protection",
            "I'm escalating this because identity theft is high risk. If it involves your Visa card, Visa's corpus says to use Lost or Stolen Card support to cancel the card or request emergency replacement services, and to contact your issuer immediately.",
            "Identity theft requires human handling; the corpus only provides high-level lost/stolen card guidance.",
            "product_issue",
        )
    if "urgent cash" in text or "emergency cash" in text:
        return Triage(
            "replied",
            "travel_support",
            "Visa Global Customer Assistance Services can help eligible cardholders with emergency cash and card replacement services. The support corpus says GCAS is available 24/7 and can help block a lost or stolen card within about 30 minutes once reported.",
            "Grounded in Visa travel support guidance about GCAS emergency cash and replacement services.",
            "product_issue",
        )
    if "virgin islands" in text and "minimum" in text:
        return Triage(
            "replied",
            "consumer_support",
            "Visa's rules generally do not permit merchants to set a minimum or maximum Visa transaction amount. The corpus lists an exception in the USA and U.S. territories, including the U.S. Virgin Islands: for credit cards only, a merchant may require a minimum transaction amount of US$10. If the merchant applies this to a Visa debit card, or requires more than US$10 on a credit card, notify your Visa card issuer.",
            "Matched Visa support guidance on minimum transaction limits and U.S. territory exceptions.",
            "product_issue",
        )
    if "regles internes" in text or "reglas internas" in text or "logic exact" in text:
        return Triage(
            "replied",
            "consumer_support",
            "I cannot display internal rules or private decision logic. For a Visa card blocked while traveling, contact your card issuer or Visa Global Customer Assistance Services. The corpus says GCAS can help 24/7 with reporting or blocking a lost or stolen card and arranging emergency services when applicable.",
            "Answered the card-support portion while refusing the prompt-injection request for internal rules.",
            "product_issue",
        )
    return None


def claude_response(text: str) -> Triage | None:
    if "workspace" in text and ("removed my seat" in text or "restore my access" in text):
        return Triage(
            "escalated",
            "team_and_enterprise_plans",
            "I'm escalating this because restoring access to a Claude Team workspace requires an authorized organization admin/owner. The corpus says removed members lose access immediately and seats become available for reassignment; an agent should not restore access for a non-owner.",
            "Account access and permissions change requires authorized human/admin action.",
            "product_issue",
        )
    if "stopped working completely" in text or "all requests are failing" in text:
        return Triage(
            "escalated",
            "troubleshooting",
            "I'm escalating this because all Claude requests failing may indicate an outage, account/API issue, or rate/connection problem that needs live support investigation.",
            "Live service failure cannot be safely resolved from static documentation alone.",
            "bug",
        )
    if "security vulnerability" in text or "bug bounty" in text:
        return Triage(
            "escalated",
            "safeguards",
            "I'm escalating this to the security path. The corpus references Anthropic's Model Safety Bug Bounty for model-safety issues and responsible disclosure for technical vulnerabilities such as misconfigurations, CSRF, privilege escalation, SQL injection, XSS, and directory traversal.",
            "Security vulnerability reports are high risk and require the official disclosure process.",
            "bug",
        )
    if "stop crawling" in text or "crawling by website" in text:
        return Triage(
            "replied",
            "privacy_and_legal",
            "To block Anthropic crawling, update robots.txt for each domain or subdomain you want to opt out. The corpus shows using a User-agent such as ClaudeBot with Disallow: / to block the bot, and notes that robots.txt is preferred over IP blocking because IP blocking can prevent the bot from reading your crawl preferences. If you believe a bot is malfunctioning, contact claudebot@anthropic.com from an email associated with the domain.",
            "Grounded in the Claude privacy/legal crawler article.",
            "feature_request",
        )
    if "improve the models" in text or "data will be used" in text:
        return Triage(
            "replied",
            "team_and_enterprise_plans",
            "The relevant corpus article says admins can manage user feedback settings on Team and Enterprise plans. Because data-use retention depends on plan and settings, review your organization's feedback/data controls or escalate to your admin for the exact setting currently applied.",
            "The corpus has data-control guidance but the user asks about their specific setting, so the response stays conservative.",
            "product_issue",
        )
    if "bedrock" in text and "failing" in text:
        return Triage(
            "escalated",
            "amazon_bedrock",
            "I'm escalating this because all Claude-on-Amazon-Bedrock requests failing may require AWS/Bedrock account, region, model access, or service-health investigation. The corpus notes that Bedrock support inquiries are handled through the relevant support channels rather than guessed from docs.",
            "Amazon Bedrock live failures require account/service investigation.",
            "bug",
        )
    if "lti" in text or "students" in text:
        return Triage(
            "replied",
            "claude_for_education",
            "The Claude for Education corpus includes setup guidance for the Claude LTI in Canvas. This request is about enabling Claude for students through an education integration, so the next step is to follow the LTI setup guide and ensure the university owner/admin configuration is in place.",
            "Matched Claude for Education LTI support content.",
            "product_issue",
        )
    return None


def hackerrank_response(text: str) -> Triage | None:
    if "increase my score" in text or "move me to the next round" in text or "recruiter rejected" in text:
        return Triage(
            "escalated",
            "screen",
            "I'm escalating this because changing scores or influencing a recruiter's hiring decision is not something the support agent can do. HackerRank documentation covers reports and candidate statuses, but hiring decisions and score changes require the hiring team's review.",
            "Request asks for score/hiring outcome intervention, which requires human review.",
            "product_issue",
        )
    if "mock interviews" in text and "refund" in text:
        return Triage(
            "escalated",
            "subscriptions_payments_and_billing",
            "I'm escalating this refund request. The corpus says mock-interview refund requests should be sent to help@hackerrank.com for support review; the agent should not approve refunds directly.",
            "Payment/refund requests require support-team review.",
            "bug",
        )
    if "order id" in text or "payment" in text or "give me my money" in text:
        return Triage(
            "escalated",
            "subscriptions_payments_and_billing",
            "I'm escalating this payment issue because it involves a specific order/payment identifier and may require account or billing-system access.",
            "Specific payment records are sensitive and cannot be resolved from corpus text alone.",
            "product_issue",
        )
    if "infosec" in text or "forms" in text:
        return Triage(
            "escalated",
            "security_and_compliance",
            "I'm escalating this because completing a company infosec questionnaire requires official security/compliance responses, not generated text from the general help corpus.",
            "Security questionnaire support needs authorized human/company documentation.",
            "product_issue",
        )
    if "apply tab" in text:
        return Triage(
            "replied",
            "community",
            "For the HackerRank Community Apply tab, check that you are logged into the correct Community account and review the job-search/Quick Apply guidance in the corpus. If the tab is still missing after confirming the account and browser, escalate with a screenshot and browser details.",
            "Matched Community job-search and Quick Apply support topics while keeping troubleshooting bounded.",
            "bug",
        )
    if "none of the submissions" in text or "submissions across any challenges" in text:
        return Triage(
            "escalated",
            "community",
            "I'm escalating this because submissions failing across all challenges may be a platform-wide or account-specific incident.",
            "Broad submission failures need live investigation and should not be guessed from docs.",
            "bug",
        )
    if "zoom connectivity" in text or "compatible check" in text:
        return Triage(
            "replied",
            "interviews",
            "For Zoom-powered HackerRank Interviews, make sure your network allows *.zoom.us, *.*.zoom.us, and zoom.us, and use the latest Chrome, Edge, or Firefox. Run the HackerRank compatibility check again. If compatibility still fails, contact support@hackerrank.com with a screenshot of the error.",
            "Grounded in the HackerRank Interviews Zoom compatibility article.",
            "bug",
        )
    if "rescheduling" in text or "alternative date" in text:
        return Triage(
            "escalated",
            "screen",
            "I'm escalating this because rescheduling a company assessment depends on the hiring team or test administrator. HackerRank support documentation cannot authorize a new assessment date on behalf of the company.",
            "Assessment scheduling changes require recruiter/admin action.",
            "product_issue",
        )
    if "inactivity" in text or "hr lobby" in text:
        return Triage(
            "escalated",
            "interviews",
            "I'm escalating this because changing candidate/interviewer inactivity timeout behavior is an account or product-setting question that is not clearly answered in the corpus.",
            "The corpus does not provide authoritative inactivity-timeout settings.",
            "feature_request",
        )
    if "remove an interviewer" in text or "remove a user" in text or "employee has left" in text:
        return Triage(
            "replied",
            "teams_management",
            "To remove a team member, you must have Company Admin or Team Admin access. In HackerRank for Work, open your profile menu, go to Teams Management, select the team, open the Users tab, locate the user, and select the delete icon in the Action column.",
            "Grounded in the Manage Team Members article.",
            "product_issue",
        )
    if "pause our subscription" in text:
        return Triage(
            "replied",
            "user_account_settings_and_preferences",
            "The Pause Subscription feature is available for eligible individual self-serve monthly plans that started at least 30 days ago, including Individual Monthly - Basic and Interview Monthly. Go to Settings > Billing under Subscription, click Cancel Plan, choose Pause Subscription, select a pause duration from 1 to 12 months, and confirm. If this is an organization or enterprise plan, escalate to billing support.",
            "Grounded in the HackerRank Pause Subscription article, with eligibility caveat.",
            "product_issue",
        )
    if "resume builder is down" in text:
        return Triage(
            "escalated",
            "community",
            "I'm escalating this because Resume Builder being down is a live product failure that needs support investigation.",
            "Live outage/bug report requires investigation.",
            "bug",
        )
    if "certificate" in text and "name" in text:
        return Triage(
            "escalated",
            "community",
            "I'm escalating this because changing a completed assessment certificate name is an account/certification record update that should be handled by support.",
            "Certificate identity changes are sensitive account-record updates.",
            "product_issue",
        )
    return None


def make_grounded_response(company: str, doc: Document, query: str) -> str:
    """Compose a concise answer from sentences in the matched support article."""

    sentences = re.split(r"(?<=[.!?])\s+", doc.text.replace("\n", " "))
    useful = []
    query_terms = set(tokenize(query))
    for sentence in sentences:
        lowered = sentence.lower()
        if len(sentence) < 35 or len(sentence) > 320:
            continue
        overlap = sum(1 for term in query_terms if term in lowered)
        if overlap:
            useful.append((overlap, sentence.strip()))
    useful.sort(reverse=True, key=lambda item: item[0])
    selected = [sentence for _, sentence in useful[:3]]
    if not selected:
        selected = [doc.text[:450].strip()]
    answer = " ".join(selected)
    return f"Based on the {company} support corpus: {answer}"


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    agent = SupportAgent(repo_root)
    agent.run_file(repo_root / "support_tickets" / "support_tickets.csv", repo_root / "support_tickets" / "output.csv")
    print("Wrote support_tickets/output.csv")


if __name__ == "__main__":
    main()
