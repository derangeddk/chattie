Feature: Chatting
    As a chat owner
    I want to be able to create chats
    In order to establish communication channels between parties

    Scenario: Create chat
        When I create a chat "Conversation 1" with the following users:
        | name            | isOwner |
        | Ejer Ejersen    | true    |
        | Visit Outsider  | false   |
        Then I should receive a chat id and 2 participant ids

    Scenario: Delete chat
        Given I created a chat "Conversation 2" with the following users:
        | name            | isOwner |
        | Ejer Ejersen    | true    |
        | Visit Outsider  | false   |
        When I delete the chat "Conversation 2"
        Then the chat "Conversation 2" no longer exists

    Scenario: Chat a bit
        Given I created a chat "Conversation 2" with the following users:
        | name            | isOwner |
        | Ejer Ejersen    | true    |
        | Visit Outsider  | false   |
        When participant "Ejer Ejersen" sends a message "Hello"
        Then a message "Hello" from "Ejer Ejersen" appears in the chat log for "Conversation 2"

    Scenario: Get log as participant
        Given I created a chat "Conversation 2" with the following users:
        | name            | isOwner |
        | Ejer Ejersen    | true    |
        | Visit Outsider  | false   |
        When participant "Ejer Ejersen" sends a message "Hello"
        Then a message "Hello" from "Ejer Ejersen" appears in the chat log as viewed by "Visit Outsider"
