/* eslint-disable */
// import { transporter } from "../config/mailgun.config";
// import moment from "moment";

type participant = {
  _id?: string;
  firstname?: string;
  lastname?: string;
  profilePicture?: string;
};

const sanitizeParticipants = (rawArray: string[]): participant[] => {
  return rawArray.map((raw) => {
    // Replace new ObjectId(...) with just the string
    const cleaned = raw
      .replace(/new ObjectId\((.*?)\)/g, (_, val) => val.replace(/'/g, '"'))
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Quote keys

    return JSON.parse(cleaned);
  });
};
const sanitizeParticipant = (raw: string): participant => {
  const cleaned = raw
    .replace(/new ObjectId\((.*?)\)/g, (_, val) => val.replace(/'/g, '"'))
    .replace(/'/g, '"')
    .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

  return JSON.parse(cleaned);
};




export {
  sanitizeParticipants,
  sanitizeParticipant,
};