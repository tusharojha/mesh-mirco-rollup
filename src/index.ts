import { ActionSchema, FIFOStrategy, MicroRollup, StackrConfig } from "@stackr/stackr-js";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { stackrConfig } from "../stackr.config";
import { StoryWebRollup, continueStorySTF } from "./state";
import { StateMachine } from "@stackr/stackr-js/execution";

import { exec } from "child_process";
import fs from 'fs'
import path from 'path'
import { generateStackrConfig } from "./generate";

const rollup = async (st: any, config: StackrConfig) => {
  const counterFsm = new StateMachine({
    state: new StoryWebRollup(st),
    stf: continueStorySTF,
  });

  const actionSchemaType = {
    type: "String",
    message: {
      role: "String",
      content: "String"
    }
  };

  const actionInput = new ActionSchema("continueStory", actionSchemaType);

  const buildStrategy = new FIFOStrategy();

  const { state, actions, events } = await MicroRollup({
    config: config,
    useState: counterFsm,
    useAction: actionInput,
    useBuilder: { strategy: buildStrategy, autorun: true },
    useSyncer: { autorun: true },
  });
  return { state, actions };
};

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  if (req.headers['x-token'] !== process.env.SERVER_TOKEN) {
    res.status(401).send({ message: 'User not valid.' })
    return;
  }
  next()
})


app.get("/createNewRollup", async (req: Request, res: Response) => {
  // child proccess call.
  // create, compile, deploy.
  exec('rm -rf deployment.json && stackr register && stackr compile', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      res.status(500).send({ message: 'Unable to create new rollup.' })
      return;
    }

    const data = JSON.parse((fs.readFileSync(path.join(__dirname, '../', 'deployment.json')).toString()))

    console.log(`Command output: ${stdout}`);

    res.send(data)
  });
});


app.get("/forkRollup", async (req: Request, res: Response) => {

  const { app_id, app_inbox, rollupState } = req.body

  if (!app_id || !app_inbox) {
    res.status(403).send()
    return;
  }

  // Loading the prevoius stored state of another rollup, here.
  const { actions, state } = await rollup({ state: rollupState }, generateStackrConfig(app_id, app_inbox));
  const schema = actions.getSchema("continueStory");

  if (!schema) {
    res.status(400).send({ message: "error" });
    return;
  }

  try {
    const newAction = schema.newAction(req.body);
    const ack = await actions.submit(newAction);
    res.status(201).send({ ack });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
});

app.get("/", async (req: Request, res: Response) => {
});

// Continue / Progress game by user's next story.
app.post("/", async (req: Request, res: Response) => {

  const { app_id, app_inbox } = req.query
  console.log(app_id, app_inbox)

  if (!app_id || !app_inbox) {
    res.status(403).send()
    return;
  }

  // pass genesis state as well. { "state": 0 }
  const { actions, state } = await rollup({ state: { conversation: [] } }, generateStackrConfig(app_id, app_inbox));
  const schema = actions.getSchema("continueStory");

  if (!schema) {
    res.status(400).send({ message: "error" });
    return;
  }

  try {
    const newAction = schema.newAction(req.body);
    const ack = await actions.submit(newAction);
    res.status(201).send({ ack });
  } catch (e: any) {
    res.status(400).send({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("listening on port 3000");
});
