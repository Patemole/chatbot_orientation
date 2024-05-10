import { ChatSession } from "../interfaces";


const config = require('../../config.js');

let apiUrlPrefix : any;
if (config.node_env !== 'production') {
    apiUrlPrefix = `${config.server_host}:${config.server_port}`;
} else {
    apiUrlPrefix = `${config.server_host}`;
}


export async function getChatSessions(username: string, course_id: string) {
    const getChatSessionResponse = await fetch(
        `${apiUrlPrefix}/chat_session/${course_id}/${username}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            }
        }
    );
    if (!getChatSessionResponse.ok) {
        console.log(
            `Failed to get chat sessions - ${getChatSessionResponse.status}`
        );
        throw Error("Failed to get chat sessions");
    }
    // Parse the response body as JSON
    const responseBody = await getChatSessionResponse.json();
    console.log("sessions:", responseBody);
    // Map the response body to the ChatSession type
    const chatSessions: ChatSession[] = responseBody.map((chatSession: any) => {
        return {
            id: chatSession['chat_id'],
            name: chatSession['name'],
            course_id: course_id,
            time_created: chatSession['timestamp']
        };
    });

    return chatSessions.reverse(); // Reverse to obtain descending order
}

export async function createChatSession(course_id: string, username: string) {
    const createChatSessionResponse = await fetch(
        `${apiUrlPrefix}/chat_session/create`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                course_id: course_id,
                username: username
            })
        }
    );
    if (!createChatSessionResponse.ok) {
        console.log(
            `Failed to get chat sessions - ${createChatSessionResponse.status}`
        );
        throw Error("Failed to get chat sessions");
    }
    const responseBody = await createChatSessionResponse.json();
    return responseBody;
}

export async function nameChatSession(chat_id: string, message: string) {
    const response = await fetch(`${apiUrlPrefix}/chat_session/name`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id: chat_id,
            first_message: message,
        }),
    });
    return response;
}

export async function renameChatSession(chat_id: string, new_name: string) {
    const response = await fetch(`${apiUrlPrefix}/chat_session/rename`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id: chat_id,
            new_name: new_name,
        }),
    });
    return response;
}


//TODO: implement API handler
export async function deleteChatSession(chat_id: string) {
    const response = await fetch(`${apiUrlPrefix}/chat_session/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id: chat_id,
        }),
    });
    return response;
};