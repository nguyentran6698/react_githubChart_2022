import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";
const rootUrl = "https://api.github.com";

const githubContext = React.createContext();
const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [followers, setFollowers] = useState(mockFollowers);
  const [repos, setRepos] = useState(mockRepos);
  // request
  const [request, setRequest] = useState(0);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  // errors
  const [error, setError] = useState({ show: false, msg: "" });
  // toggleError functio
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        console.log(data);
        let {
          rate: { remaining, limit },
        } = data;
        setRequest(remaining);
        setLimit(limit);
        if (remaining === 0) {
          toggleError(true, "you have exceeded your hourly rate limit");
        }
      })
      .catch((err) => console.log(err));
  };
  const searchGitHubUser = async (user) => {
    toggleError();
    setLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      const { data } = response;
      setGithubUser(data);
      const { login, followers_url } = response.data;
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user with that username");
    }
    checkRequests();
    setLoading(false);
  };
  useEffect(checkRequests, []);
  return (
    <githubContext.Provider
      value={{
        githubUser,
        followers,
        loading,
        repos,
        request,
        error,
        searchGitHubUser,
        limit,
      }}
    >
      {children}
    </githubContext.Provider>
  );
};

export const useGlobalContext = () => {
  return React.useContext(githubContext);
};

export { GithubProvider };
