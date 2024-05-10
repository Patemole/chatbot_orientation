import { RefObject } from "react";
import { ChatSession, Message } from "./interfaces";
export function groupSessionsByDateRange(chatSessions: ChatSession[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for accurate comparison

    const groups: Record<string, ChatSession[]> = {
        Today: [],
        "Previous 7 Days": [],
        "Previous 30 Days": [],
        "Over 30 days ago": [],
    };

    chatSessions.forEach((chatSession) => {
        const chatSessionDate = new Date(chatSession.time_created);

        const diffTime = today.getTime() - chatSessionDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24); // Convert time difference to days

        if (diffDays < 1) {
            groups["Today"].push(chatSession);
        } else if (diffDays <= 7) {
            groups["Previous 7 Days"].push(chatSession);
        } else if (diffDays <= 30) {
            groups["Previous 30 Days"].push(chatSession);
        } else {
            groups["Over 30 days ago"].push(chatSession);
        }
    });

    return groups;
}

export function getLastSuccessfulMessageId(messageHistory: Message[]) {
    const lastSuccessfulMessage = messageHistory
        .slice()
        .reverse()
        .find(
            (message) =>
                message.type === "assistant" &&
                message.messageId !== -1 &&
                message.messageId !== null
        );
    return lastSuccessfulMessage ? lastSuccessfulMessage?.messageId : null;
}

export function handleAutoScroll(
    endRef: RefObject<any>,
    scrollableRef: RefObject<any>,
    buffer: number = 300
) {
    // Auto-scrolls if the user is within `buffer` of the bottom of the scrollableRef
    if (endRef && endRef.current && scrollableRef && scrollableRef.current) {
        if (
            scrollableRef.current.scrollHeight -
            scrollableRef.current.scrollTop -
            buffer <=
            scrollableRef.current.clientHeight
        ) {
            endRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }
}

export function getHumanAndAIMessageFromMessageNumber(
    messageHistory: Message[],
    messageId: number
) {
    let messageInd;
    // -1 is special -> means use the last message
    if (messageId === -1) {
        messageInd = messageHistory.length - 1;
    } else {
        messageInd = messageHistory.findIndex(
            (message) => message.messageId === messageId
        );
    }
    if (messageInd !== -1) {
        const matchingMessage = messageHistory[messageInd];
        const pairedMessage =
            matchingMessage.type === "user"
                ? messageHistory[messageInd + 1]
                : messageHistory[messageInd - 1];

        const humanMessage =
            matchingMessage.type === "user" ? matchingMessage : pairedMessage;
        const aiMessage =
            matchingMessage.type === "user" ? pairedMessage : matchingMessage;

        return {
            humanMessage,
            aiMessage,
        };
    } else {
        return {
            humanMessage: null,
            aiMessage: null,
        };
    }
}