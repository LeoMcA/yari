import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAiChat } from "./use-ai";
import { AiLoginBanner } from "./login-banner";
import { useUserData } from "../../user-context";
import Container from "../../ui/atoms/container";
import { FeatureId, MDN_PLUS_TITLE } from "../../constants";
import { useScrollToTop, useViewedState } from "../../hooks";
import { Icon } from "../../ui/atoms/icon";
import Mandala from "../../ui/molecules/mandala";

import "./index.scss";
import { Avatar } from "../../ui/atoms/avatar";
import { isPlusSubscriber } from "../../utils";
import { Button } from "../../ui/atoms/button";

const questions: string[] = [
  "What pages can you recommend to learn web development?",
  "How to migrate a table layout to grid?",
  "What are some tips to make my site accessible?",
  "How can I apply functional programming with JavaScript?",
  "What are some techniques to improve web performance?",
  "How can I read and write to the clipboard?",
  "What does it mean if a web feature is baseline?",
  "How can I contribute to MDN?",
];

export function AiHelp() {
  document.title = `AI Help | ${MDN_PLUS_TITLE}`;
  useScrollToTop();
  const user = useUserData();
  const { setViewed } = useViewedState();
  useEffect(() => setViewed(FeatureId.PLUS_AI_HELP));

  return (
    <div className="ai-help">
      <header className="plus-header-mandala">
        <Container>
          <h1>
            <div className="mandala-icon-wrapper">
              <Mandala rotate={true} />
              <Icon name="chatgpt" />
            </div>
            <span>AI Help</span>
          </h1>
          <p>
            Get answers using generative AI based on MDN content.
            <br />
            <a
              href="https://www.example.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="external"
            >
              We'd love to hear your feedback!
            </a>
          </p>
        </Container>
      </header>
      <Container>
        {user && !user.isAuthenticated ? <AiLoginBanner /> : <AIHelpInner />}
      </Container>
    </div>
  );
}

export function AIHelpInner() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const user = useUserData();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isResponding, hasError, messages, submit } = useAiChat({
    setIsLoading,
  });

  return (
    <section
      className={["ai-help-inner", query && "has-input"]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="ai-help-body">
        <>
          {hasError && (
            <section className="ai-help-error">An error occurred.</section>
          )}
          {messages.length ? (
            <ul className="ai-help-messages">
              {messages.map((message, index) => (
                <li
                  className={`ai-help-message ai-help-message-${message.role}`}
                >
                  <div className="ai-help-message-role">
                    <RoleIcon role={message.role} />
                  </div>
                  <div
                    className={["ai-help-message-content", message.status]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {message.role === "user" ? (
                      message.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        linkTarget="_blank"
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <section className="ai-help-examples">
              {questions.map((question) => (
                <button
                  type="button"
                  className="ai-help-example"
                  onClick={() => submit(question)}
                >
                  <span className="ai-help-example-icon">⚡️</span>{" "}
                  <span className="ai-help-example-text">{question}</span>
                </button>
              ))}
            </section>
          )}
        </>
      </div>
      <div className="ai-help-footer">
        <form
          ref={formRef}
          onSubmit={(event) => {
            event.preventDefault();
            if (query) {
              submit(query);
            }
          }}
        >
          <input
            ref={inputRef}
            disabled={isLoading || isResponding}
            type="text"
            onChange={(event) => setQuery(event.target.value.trim())}
            placeholder={
              isLoading
                ? "Waiting for an answer..."
                : isResponding
                ? "Receiving answer..."
                : isPlusSubscriber(user)
                ? "Ask your question (unlimited questions per day)."
                : "Ask your question (up to 5 questions per day)."
            }
          />
          <Button
            type="action"
            icon="send"
            buttonType="submit"
            isDisabled={!query}
            extraClasses="send-ai-message-button"
          >
            <span className="visually-hidden">Submit question</span>
          </Button>
        </form>
        <div className="ai-help-footer-text">
          <span>
            This feature is powered by{" "}
            <a
              href="https://supabase.com/"
              target="_blank"
              rel="noreferrer"
              className="external"
            >
              Supabase
            </a>{" "}
            and{" "}
            <a
              href="https://openai.com/"
              target="_blank"
              rel="noreferrer"
              className="external"
            >
              OpenAI
            </a>
            .
          </span>
        </div>
      </div>
    </section>
  );
}

export function RoleIcon({ role }: { role: "user" | "assistant" }) {
  const userData = useUserData();

  switch (role) {
    case "user":
      return <Avatar userData={userData} />;

    case "assistant":
      return <Icon name="chatgpt" />;
  }
}
