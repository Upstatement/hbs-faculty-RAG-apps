import React, { useState, useEffect } from "react";
import axios from "axios";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [userType, setUserType] = useState("Professional");
  const [queryType, setQueryType] = useState("advice");
  const [fieldType, setFieldType] = useState("Entrepreneurship and Startups");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [response, setResponse] = useState("");
  const [refinement, setRefinement] = useState("");
  const [showRefinement, setShowRefinement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);

  useEffect(() => {
    if (!sessionStorage.getItem("uniqueID")) {
      sessionStorage.setItem("uniqueID", uuidv4());
    }
  }, []);

  const constructQuery = () => {
    let queryParts = [];
    if (userType !== "---") queryParts.push(`I am a ${userType}`);
    if (queryType !== "---") queryParts.push(`looking for ${queryType}`);
    if (fieldType !== "---") queryParts.push(`about ${fieldType}`);
    if (additionalInfo) queryParts.push(additionalInfo);

    return queryParts.join(". ") + ".";
  };

  const handleInitialSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const query = constructQuery();
      const uniqueID = sessionStorage.getItem("uniqueID");

      const res = await axios.post(
        "http://localhost:5000/chat",
        {
          question: query,
        },
        {
          headers: {
            "Content-Type": "application/json",
            uniqueID: uniqueID,
          },
        }
      );
      setResponse(res.data.response);
      fetchFollowUpQuestions();

      setShowRefinement(true);
    } catch (error) {
      console.error("Error during API call", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowUpQuestions = async () => {
    const uniqueID = sessionStorage.getItem("uniqueID");
    try {
      const res = await axios.post(
        "http://localhost:5000/follow-up-questions",
        {},
        {
          headers: {
            "Content-Type": "application/json",
            uniqueID: uniqueID,
          },
        }
      );
      setFollowUpQuestions(res.data.questions);
    } catch (error) {
      console.error("Error fetching follow-up questions", error);
    }
  };

  const handleQuestionButtonClick = (questionText) => {
    setRefinement(questionText);
  };

  const handleRefinementSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const uniqueID = sessionStorage.getItem("uniqueID");

    try {
      const res = await axios.post(
        "http://localhost:5000/chat",
        {
          question: refinement,
        },
        {
          headers: {
            "Content-Type": "application/json",
            uniqueID: uniqueID,
          },
        }
      );
      setResponse(res.data.response);
      setRefinement("");
      fetchFollowUpQuestions();
    } catch (error) {
      console.error("Error during API call", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderResponse = () => {
    return { __html: DOMPurify.sanitize(marked.parse(response)) };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        HBS Faculty Explorer
      </h1>
      {!response && !isLoading && (
        <form
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={handleInitialSubmit}
        >
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              I am a
              <select
                className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-1 block w-full"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="Professional">Professional</option>
                <option value="Student">Student</option>
                <option value="Small Business Owner">
                  Small Business Owner
                </option>
                <option value="Researcher">Researcher</option>
                <option value="Professor">Professor</option>
                <option value="---">---</option>
              </select>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Looking for
              <select
                className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-1 block w-full"
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
              >
                <option value="advice">Advice</option>
                <option value="information on a prof">
                  Information on a professor
                </option>
                <option value="research">Research</option>
                <option value="---">---</option>
              </select>
            </label>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              In
              <select
                className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-1 block w-full"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
              >
                <option value="Startups">Startups</option>
                <option value="Leadership">Leadership</option>

                <option value="Design">Design</option>
                <option value="Innovation Strategy">Innovation Strategy</option>
                <option value="Consumer Behavior">Consumer Behavior</option>
                <option value="Diversity and Inclusion">
                  Diversity and Inclusion
                </option>
                <option value="Organizational Behavior">
                  Organizational Behavior
                </option>
                <option value="Supply Chain Management">
                  Supply Chain Management
                </option>
                <option value="Digital Transformation">
                  Digital Transformation
                </option>
                <option value="Corporate Social Responsibility">
                  Corporate Social Responsibility
                </option>
                <option value="Marketing">Marketing</option>

                <option value="Finance">Finance</option>
                <option value="Accounting">Accounting</option>
                <option value="Sustainability">Sustainability</option>

                <option value="---">---</option>
              </select>
            </label>
          </div>
          <div className="mb-6">
            <textarea
              className="shadow appearance-none border rounded w-full py-4 px-3 h-32 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Anything else?"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Submit
          </button>
        </form>
      )}
      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {response && !isLoading && (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-2xl mx-auto">
          <div className="mb-4 text-lg font-semibold">Response:</div>
          <div
            className="response-content prose text-gray-700 mx-auto"
            dangerouslySetInnerHTML={renderResponse()}
          ></div>

          {showRefinement && (
            <form onSubmit={handleRefinementSubmit} className="mt-4">
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Refine your query"
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                rows="3"
              />

              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
                type="submit"
              >
                Submit
              </button>
            </form>
          )}

          {followUpQuestions && (
            <div className="follow-up-questions my-4">
              {followUpQuestions.map((question, index) => (
                <button
                  key={index}
                  className="bg-gray-50 hover:bg-gray-200 text-gray-500  py-2 px-4 border border-gray-200 rounded shadow m-2 text-left w-full"
                  onClick={() => handleQuestionButtonClick(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
