import Counter from '../Models/Common/counter.js';

const getNextSequence = async (key) => {
  const counter = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

export default getNextSequence;
