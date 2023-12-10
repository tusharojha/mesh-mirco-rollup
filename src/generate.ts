import { KeyPurpose, SignatureScheme, StackrConfig } from "@stackr/stackr-js";
import dotenv from 'dotenv'

dotenv.config()

export const generateStackrConfig = (app_id: string, app_inbox: string): StackrConfig => {
  return {
    stackrApp: {
      appId: parseInt(app_id),
      appInbox: app_inbox,
    },
    builder: {
      batchSize: 1,
      batchTime: 1000,
    },
    syncer: {
      slotTime: 1000,
      vulcanRPC: "http://vulcan.stf.xyz",
      L1RPC: "http://rpc.stf.xyz",
    },
    operator: {
      accounts: [
        {
          privateKey: process.env.PRIVATE_KEY ?? '',
          purpose: KeyPurpose.BATCH,
          scheme: SignatureScheme.ECDSA,
        },
      ],
    },
    domain: {
      name: "Stackr MVP v0",
      version: "1",
      chainId: 1,
      verifyingContract: app_inbox,
      salt: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    },
    datastore: {
      filePath: "./datastore/" + app_id,
    },
  };
}