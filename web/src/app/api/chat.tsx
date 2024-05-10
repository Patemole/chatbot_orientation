import { AnswerDocumentPacket, Message, StreamingError } from "../interfaces";
import { AnswerPiecePacket } from "../interfaces";
import { handleStream } from "./streaming_utils";

const config = require('../../config.js');


let apiUrlPrefix: any;
if (config.node_env !== 'production') {
    apiUrlPrefix = `${config.server_host}:${config.server_port}`;
} else {
    apiUrlPrefix = `${config.server_host}`;
}

export async function getChatHistory(chat_id: string) {
    const getChatHistoryResponse = await fetch(
        `${apiUrlPrefix}/chat/get_chat_history/${chat_id}`,
        {
            method: "GET",
        }
    );
    if (!getChatHistoryResponse.ok) {
        console.log(
            `Failed to get chat history - ${getChatHistoryResponse.status}`
        );
        throw Error("Failed to get chat history");
    }
    // Parse the response body as JSON
    const responseBody = await getChatHistoryResponse.json();

    // Map the response body to the ChatSession type
    const messages: Message[] = responseBody.map((message: any) => {
        const newMessage: Message = {
            messageId: null,
            message: message['body'],
            type: message['username'] === "TAI" ? "assistant" : "user",
        };
        if (Object.hasOwn(message, 'documents')) {
            newMessage.documents = message.documents;
        }
        return newMessage;
    });

    return messages;
}

export interface SendMessageRequest {
    message: string;
    chatSessionId: string;
    courseId: string;
    username: string;
    // parentMessageId: string | null;
    // promptId: number | null | undefined;
    // filters: Filters | null;
    // selectedDocumentIds: number[] | null;
    // queryOverride?: string;
    // forceSearch?: boolean;
}

export async function* sendMessage({
    message,
    chatSessionId,
    courseId,
    username
    // parentMessageId,
    // promptId,
    // filters,
    // selectedDocumentIds,
    // queryOverride,
    // forceSearch,
}: SendMessageRequest) {
  console.log("SENDING MESSSAGE");
    // const documentsAreSelected =
    //     selectedDocumentIds && selectedDocumentIds.length > 0;
    const sendMessageResponse = await fetch(`${apiUrlPrefix}/chat/send_message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            //course_id: courseId,
            course_id: "course_id_test",
            //username: username,
            username: "greg_test",
            message: message,
            chat_id: "chat_id_test"
            //chat_id: chatSessionId
            // parent_message_id: parentMessageId,
            // prompt_id: promptId,
            // search_doc_ids: documentsAreSelected ? selectedDocumentIds : null,
            // retrieval_options: !documentsAreSelected
            //     ? {
            //         run_search:
            //             promptId === null ||
            //                 promptId === undefined ||
            //                 queryOverride ||
            //                 forceSearch
            //                 ? "always"
            //                 : "auto",
            //         real_time: true,
            //         filters: filters,
            //     }
            //     : null,
            // query_override: queryOverride,
        }),
    });
    if (!sendMessageResponse.ok) {
        const errorJson = await sendMessageResponse.json();
        const errorMsg = errorJson.message || errorJson.detail || "";
        throw Error(`Failed to send message - ${errorMsg}`);
    }

    yield* handleStream<
        AnswerPiecePacket | AnswerDocumentPacket | StreamingError
    >(sendMessageResponse);
}