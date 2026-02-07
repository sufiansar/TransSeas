import Stripe from "stripe";
import dbConfig from "./db.config";


export const stripe = new Stripe(dbConfig.stripe.stripe_secret_key as string);

