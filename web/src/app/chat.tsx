import React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FiRefreshCcw, FiSend, FiStopCircle } from "react-icons/fi";
import { AIMessage, HumanMessage } from "./Messages";

import {
  AnswerDocument,
  AnswerDocumentPacket,
  AnswerPiecePacket,
  BackendChatSession,
  BackendMessage,
  DocumentsResponse,
  Message,
  RetrievalType,
  StreamingError,
} from "./interfaces";

import { ThreeDots } from "react-loader-spinner";

import { FeedbackType } from "./types";
import { getChatHistory, sendMessage } from "./api/chat";
import { getHumanAndAIMessageFromMessageNumber, getLastSuccessfulMessageId, handleAutoScroll } from "./utils";

import { usePopup } from "./../components/Popup"
import { createChatSession, nameChatSession } from "./api/sessions";
import { ChatIntro } from "./ChatIntro";


const MAX_INPUT_HEIGHT = 200;
const HEADER_PADDING = "pt-[0px]";

export const Chat = ({
  username,
  existingChatSessionId,
  existingChatSessionCourseId,
  defaultSelectedPersonaId,
  documentSidebarInitialWidth,
  shouldhideBeforeScroll,
}: {
  username: string | null,
  existingChatSessionId: string | null;
  existingChatSessionCourseId: string;
  defaultSelectedPersonaId?: number; // what persona to default to
  documentSidebarInitialWidth?: number;
  shouldhideBeforeScroll?: boolean;
}) => {
  const navigate = useNavigate();
  // const router = useRouter();
  const { popup, setPopup } = usePopup();

  // fetch messages for the chat session
  const [isFetchingChatMessages, setIsFetchingChatMessages] = useState(
    existingChatSessionId !== null
  );

  // needed so closures (e.g. onSubmit) can access the current value
  const urlChatSessionId = useRef<string | null>();
  // this is triggered every time the user switches which chat
  // session they are using
  useEffect(() => {
    urlChatSessionId.current = existingChatSessionId;

    textareaRef.current?.focus();

    // only clear things if we're going from one chat session to another
    if (chatSessionId !== null && existingChatSessionId !== chatSessionId) {
      if (isStreaming) {
        setIsCancelled(true);
      }
    }

    setChatSessionId(existingChatSessionId);

    async function initialSessionFetch() {
      if (existingChatSessionId === null) {
        setIsFetchingChatMessages(false);

        setMessageHistory([]);
        return;
      }

      setIsFetchingChatMessages(true);
      const newMessageHistory = await getChatHistory(existingChatSessionId);

     
      setMessageHistory(newMessageHistory);

      const latestMessageId =
        newMessageHistory[newMessageHistory.length - 1]?.messageId;
      setSelectedMessageForDocDisplay(
        latestMessageId !== undefined ? latestMessageId : null
      );

      setIsFetchingChatMessages(false);
    }

    initialSessionFetch();
  }, [existingChatSessionId]);

  const [chatSessionId, setChatSessionId] = useState<string | null>(
    existingChatSessionId
  );
  const [message, setMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // for document display
  // NOTE: -1 is a special designation that means the latest AI message
  const [selectedMessageForDocDisplay, setSelectedMessageForDocDisplay] =
    useState<number | null>(null);
  const { aiMessage } = selectedMessageForDocDisplay
    ? getHumanAndAIMessageFromMessageNumber(
      messageHistory,
      selectedMessageForDocDisplay
    )
    : { aiMessage: null };


  useEffect(() => {
    if (messageHistory.length === 0 && chatSessionId === null) {
    
    }
  }, [defaultSelectedPersonaId]);

  const [maxTokens, setMaxTokens] = useState<number>(4096);
  

  // state for cancelling streaming
  const [isCancelled, setIsCancelled] = useState(false);
  const isCancelledRef = useRef(isCancelled);
  useEffect(() => {
    isCancelledRef.current = isCancelled;
  }, [isCancelled]);

  const [currentFeedback, setCurrentFeedback] = useState<
    [FeedbackType, number] | null
  >(null);

  // auto scroll as message comes out
  const scrollableDivRef = useRef<HTMLDivElement>(null);
  const endDivRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isStreaming || !message) {
      handleAutoScroll(endDivRef, scrollableDivRef);
    }
  });

  // scroll to bottom initially
  const [hasPerformedInitialScroll, setHasPerformedInitialScroll] = useState(
    shouldhideBeforeScroll !== true
  );
  useEffect(() => {
    endDivRef.current?.scrollIntoView();
    setHasPerformedInitialScroll(true);
  }, [isFetchingChatMessages]);

  // handle re-sizing of the text area
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        MAX_INPUT_HEIGHT
      )}px`;
    }
  }, [message]);

  // used for resizing of the document sidebar
  const masterFlexboxRef = useRef<HTMLDivElement>(null);
  const [maxDocumentSidebarWidth, setMaxDocumentSidebarWidth] = useState<
    number | null
  >(null);
  const adjustDocumentSidebarWidth = () => {
    if (masterFlexboxRef.current && document.documentElement.clientWidth) {
      // numbers below are based on the actual width the center section for different
      // screen sizes. `1700` corresponds to the custom "3xl" tailwind breakpoint
      // NOTE: some buffer is needed to account for scroll bars
      if (document.documentElement.clientWidth > 1700) {
        setMaxDocumentSidebarWidth(masterFlexboxRef.current.clientWidth - 950);
      } else if (document.documentElement.clientWidth > 1420) {
        setMaxDocumentSidebarWidth(masterFlexboxRef.current.clientWidth - 760);
      } else {
        setMaxDocumentSidebarWidth(masterFlexboxRef.current.clientWidth - 660);
      }
    }
  };
  useEffect(() => {
    adjustDocumentSidebarWidth(); // Adjust the width on initial render
    window.addEventListener("resize", adjustDocumentSidebarWidth); // Add resize event listener

    return () => {
      window.removeEventListener("resize", adjustDocumentSidebarWidth); // Cleanup the event listener
    };
  }, []);

  if (!documentSidebarInitialWidth && maxDocumentSidebarWidth) {
    documentSidebarInitialWidth = Math.min(700, maxDocumentSidebarWidth);
  }






  // ANCIENNE LOGIQUE POUR GÉRER LES SESSIONS, COMMENTÉE POUR RÉFÉRENCE FUTURE
  const onSubmit = async ({
    messageIdToResend,
    messageOverride,
    queryOverride,
    forceSearch,
  }: {
    messageIdToResend?: number;
    messageOverride?: string;
    queryOverride?: string;
    forceSearch?: boolean;
  } = {}) => {

    const messageToResend = messageHistory.find(
      (message) => message.messageId === messageIdToResend
    );
    const messageToResendIndex = messageToResend
      ? messageHistory.indexOf(messageToResend)
      : null;
    if (!messageToResend && messageIdToResend !== undefined) {
      setPopup({
        message:
          "Failed to re-send message - please refresh the page and try again.",
        type: "error",
      });
      return;
    }

    let currChatSessionId: string;
    let isNewSession = chatSessionId === null;
    
    currChatSessionId = "chat_sessions_test"
    setChatSessionId(currChatSessionId);


    let currMessage = messageToResend ? messageToResend.message : message;
    if (messageOverride) {
      currMessage = messageOverride;
    }
    const currMessageHistory =
      messageToResendIndex !== null
        ? messageHistory.slice(0, messageToResendIndex)
        : messageHistory;
    setMessageHistory([
      ...currMessageHistory,
      {
        messageId: 0,
        message: currMessage,
        type: "user",
      },
    ]);
    setMessage("");

    setIsStreaming(true);
    let answer = "";
    let answer_documents: AnswerDocument[] = [];
    let query: string | null = null;
    let error: string | null = null;
    let finalMessage: BackendMessage | null = null;
    try {
      const lastSuccessfulMessageId =
        getLastSuccessfulMessageId(currMessageHistory);
      for await (const packetBunch of sendMessage({
        message: currMessage,
        chatSessionId: currChatSessionId,
        courseId: existingChatSessionCourseId!,
        username: username!
      
      })) {
        for (const packet of packetBunch) {
          if (Object.hasOwn(packet, "answer_piece")) {
            answer += (packet as AnswerPiecePacket).answer_piece;
          }
          else if (Object.hasOwn(packet, "answer_document")) {
            answer_documents.push((packet as AnswerDocumentPacket).answer_document)
          }
        
          else if (Object.hasOwn(packet, "error")) {
            error = (packet as StreamingError).error;
          }
          // else if (Object.hasOwn(packet, "message_id")) {
          //   finalMessage = packet as BackendMessage;
          // }
        }
        setMessageHistory([
          ...currMessageHistory,
          {
            messageId: null, //finalMessage?.parent_message ||
            message: currMessage,
            type: "user",
          },
          {
            messageId: null,  // finalMessage?.message_id ||
            message: error || answer,
            type: error ? "error" : "assistant",
            // retrievalType,
            query: query, //|| finalMessage?.rephrased_query,
            documents: answer_documents // finalMessage?.context_docs?.top_documents || documents,
            // citations: finalMessage?.citations || {},
          },
        ]);
        if (isCancelledRef.current) {
          setIsCancelled(false);
          break;
        }
      }
    } catch (e: any) {
      const errorMsg = e.message;
      setMessageHistory([
        ...currMessageHistory,
        {
          messageId: null,
          message: currMessage,
          type: "user",
        },
        {
          messageId: null,
          message: errorMsg,
          type: "error",
        },
      ]);
    }
    setIsStreaming(false);
    if (isNewSession) {
      // if (finalMessage) {
      //   setSelectedMessageForDocDisplay(finalMessage.message_id);
      // }
      await nameChatSession(currChatSessionId, currMessage);

      // NOTE: don't switch pages if the user has navigated away from the chat
      if (
        currChatSessionId === urlChatSessionId.current ||
        urlChatSessionId.current === null
      ) {
        navigate(`${window.location.pathname}?chatId=${currChatSessionId}`, { replace: true });
      }
    }
    
  };

//Fin de la fonction OnSubmit






  const retrievalDisabled = false;//!personaIncludesRetrieval(livePersona);
  


  return (
    <div className="flex w-full overflow-x-hidden" ref={masterFlexboxRef}>
      {/* {popup} */}
      {}

      {documentSidebarInitialWidth !== undefined ? (
        <>
          <div
            className={`w-full sm:relative h-full ${retrievalDisabled ? "pb-[111px]" : "pb-[140px]"
              }`}
          >
            <div
              className={`w-full h-full ${HEADER_PADDING} flex flex-col overflow-y-auto overflow-x-hidden relative`}
              ref={scrollableDivRef}
            >
              {}

              {messageHistory.length === 0 &&
                !isFetchingChatMessages &&
                !isStreaming && (
                  <ChatIntro
                  
                  // }}
                  />
                )}

              <div
                className={
                  "mt-4 pt-12 sm:pt-0 mx-8" +
                  (hasPerformedInitialScroll ? "" : " invisible")
                }
              >
                {messageHistory.map((message, i) => {
                  if (message.type === "user") {
                    return (
                      <div key={i}>
                        <HumanMessage content={message.message} />
                      </div>
                    );
                  } else if (message.type === "assistant") {
                    const isShowingRetrieved =
                      (selectedMessageForDocDisplay !== null &&
                        selectedMessageForDocDisplay === message.messageId) ||
                      (selectedMessageForDocDisplay === -1 &&
                        i === messageHistory.length - 1);
                    const previousMessage =
                      i !== 0 ? messageHistory[i - 1] : null;
                    return (
                      <div key={i}>
                        <AIMessage
                          messageId={message.messageId}
                          content={message.message}
                          query={messageHistory[i]?.query || undefined}
                          personaName={"Lucy"} // TODO: Change
                          citedDocuments={message.documents} // TODO: getCitedDocumentsFromMessage(message)
                          isComplete={
                            i !== messageHistory.length - 1 || !isStreaming
                          }
                          hasDocs={
                            (message.documents &&
                              message.documents.length > 0) === true
                          }
                          handleFeedback={
                            i === messageHistory.length - 1 && isStreaming
                              ? undefined
                              : (feedbackType) =>
                                setCurrentFeedback([
                                  feedbackType,
                                  message.messageId as number,
                                ])
                          }
                          handleSearchQueryEdit={
                            i === messageHistory.length - 1 && !isStreaming
                              ? (newQuery) => {
                                
                              }
                              : undefined
                          }
                          isCurrentlyShowingRetrieved={isShowingRetrieved}
                          handleShowRetrieved={(messageNumber) => {
                            if (isShowingRetrieved) {
                              setSelectedMessageForDocDisplay(null);
                            } else {
                              if (messageNumber !== null) {
                                setSelectedMessageForDocDisplay(messageNumber);
                              } else {
                                setSelectedMessageForDocDisplay(-1);
                              }
                            }
                          }}
                          handleForceSearch={() => {
                            if (previousMessage && previousMessage.messageId) {
                              
                            } else {
                              
                            }
                          }}
                          retrievalDisabled={retrievalDisabled}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={i}>
                        <AIMessage
                          messageId={message.messageId}
                          personaName={"Lucy"} //TODO: Change
                          content={
                            <p className="text-red-700 text-sm my-auto">
                              {message.message}
                            </p>
                          }
                        />
                      </div>
                    );
                  }
                })}

                {isStreaming &&
                  messageHistory.length &&
                  messageHistory[messageHistory.length - 1].type === "user" && (
                    <div key={messageHistory.length}>
                      <AIMessage
                        messageId={null}
                        personaName={"Lucy"} // Change
                        content={
                          <div className="text-sm my-auto">
                            <ThreeDots
                              height="30"
                              width="50"
                              color="#955bf7"
                              ariaLabel="grid-loading"
                              radius="12.5"
                              wrapperStyle={{}}
                              wrapperClass=""
                              visible={true}
                            />
                          </div>
                        }
                      />
                    </div>
                  )}

                {/* Some padding at the bottom so the search bar has space at the bottom to not cover the last message*/}
                <div className={`min-h-[30px] w-full`}></div>
                {}

                <div ref={endDivRef} />
              </div>
            </div>

            <div className="absolute bottom-0 z-10 w-full bg-background border-t border-border">
              <div className="w-full pb-4 pt-2">
                {!retrievalDisabled && (
                  <div className="flex">
                    <div className="w-searchbar-xs 2xl:w-searchbar-sm 3xl:w-searchbar mx-auto px-4 pt-1 flex">
                      {}
                    </div>
                  </div>
                )}

                <div className="flex justify-center py-2 max-w-screen-lg mx-auto mb-2">
                  <div className="w-full shrink relative px-4 w-searchbar-xs 2xl:w-searchbar-sm 3xl:w-searchbar mx-auto">
                    <textarea
                      ref={textareaRef}
                      autoFocus
                      className={`
                        opacity-100
                        w-full
                        shrink
                        border 
                        border-border 
                        rounded-lg 
                        outline-none 
                        placeholder-gray-400 
                        pl-4
                        pr-12 
                        py-4 
                        overflow-hidden
                        h-14
                        ${(textareaRef?.current?.scrollHeight || 0) >
                          MAX_INPUT_HEIGHT
                          ? "overflow-y-auto"
                          : ""
                        } 
                        whitespace-normal 
                        break-word
                        overscroll-contain
                        resize-none
                      `}
                      style={{ scrollbarWidth: "thin" }}
                      role="textarea"
                      aria-multiline
                      placeholder="Ask me anything..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          message &&
                          !isStreaming
                        ) {
                          onSubmit();
                          event.preventDefault();
                        }
                      }}
                      suppressContentEditableWarning={true}
                    />
                    <div className="absolute bottom-4 right-10">
                      <div
                        className={"cursor-pointer"}
                        onClick={() => {
                          if (!isStreaming) {
                            if (message) {
                              onSubmit();
                            }
                          } else {
                            setIsCancelled(true);
                          }
                        }}
                      >
                        {isStreaming ? (
                          <FiStopCircle
                            size={18}
                            className={
                              "text-emphasis w-9 h-9 p-2 rounded-lg hover:bg-hover"
                            }
                          />
                        ) : (
                          <FiSend
                            size={18}
                            className={
                              "text-emphasis w-9 h-9 p-2 rounded-lg " +
                              (message ? "bg-medium-purple-200" : "")
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
        </>
      ) : (
        <div className="mx-auto h-full flex flex-col">
          <div className="my-auto">
            {/* <DanswerInitializingLoader /> */}
          </div>
        </div>
      )}
    </div>
  );
};
