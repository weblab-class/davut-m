import React, { useState, useEffect } from "react";
import SingleMessage from "./SingleMessage";
import { NewMessage } from "./NewPostInput";
import { get } from "../../utilities";
import { socket } from "../../client-socket";

import "./Chat.css";

/**
 * @typedef UserObject
 * @property {string} _id
 * @property {string} name
 */
/**
 * @typedef MessageObject
 * @property {UserObject} sender
 * @property {string} content
 */
/**
 * @typedef ChatData
 * @property {MessageObject[]} messages
 * @property {UserObject} recipient
 */

/**
 * Renders main chat window including previous messages,
 * who is being chatted with, and the new message input.
 *
 * Proptypes
 * @param {ChatData} data
 */
const Chat = (props) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    get("/api/messages").then((messages) => {
      setMessages(messages);
    });

    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    socket.on("message", handleNewMessage);
    return () => {
      socket.off("message", handleNewMessage);
    };
  }, []);

  return (
    <div className="u-flexColumn Chat-container">
      <h3>Chatting with {props.data.recipient.name}</h3>
      <div className="Chat-historyContainer">
        {messages.map((m, i) => (
          <SingleMessage message={m} key={i} />
        ))}
      </div>
      <div className="Chat-newContainer">
        <NewMessage recipient={props.data.recipient} />
      </div>
    </div>
  );
}

export default Chat;
