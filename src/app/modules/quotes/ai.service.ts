import axios from "axios";

export const processQuotationItemsWithAI = async (items: any[]) => {
  const response = await axios.post(
    "https://ai-team.com/api/process-items",
    { items },
    {
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
    },
  );
  return response.data.processedItems;
};
