import { RollupState, STF } from "@stackr/stackr-js/execution";
import { ethers, keccak256, toUtf8Bytes } from "ethers";
import { Conversations, Message } from "./types";

export type StateVariable = {
  conversation: Message[]
};

interface StateTransport {
  currentCount: StateVariable;
}

export interface CounterActionInput {
  type: "continueStory";
  message: Message
}

export class StoryWebRollup extends RollupState<StateVariable, StateTransport> {
  constructor(count: StateVariable) {
    super(count);
  }

  createTransport(state: StateVariable): StateTransport {
    return { currentCount: state };
  }

  getState(): StateVariable {
    return this.transport.currentCount;
  }

  calculateRoot(): ethers.BytesLike {
    return keccak256(toUtf8Bytes(JSON.stringify(this.transport.currentCount)));
  }
}

export const continueStorySTF: STF<StoryWebRollup, CounterActionInput> = {
  identifier: "continueStorySTF",

  apply(inputs: CounterActionInput, state: StoryWebRollup): void {
    let newState = state.getState();
    if (inputs.type === "continueStory") {
      newState.conversation.push(inputs.message)
    } else {
      throw new Error("Not implemented");
    }
    state.transport.currentCount = newState;
  },
};
