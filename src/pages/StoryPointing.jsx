import React from 'react';

function StoryPointing() {
  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 max-md:p-4">
      <div className="text-center mb-12 p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">Story Pointing & Planning Poker Guide</h1>
        <p className="text-xl text-gray-600 italic">— For Grooming & Refinement Sessions —</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg max-md:p-4">
        <div className="flex gap-8 mb-8 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <h2 className="text-2xl text-gray-800 mb-4">Story points are a <em className="text-blue-700 font-bold italic">relative, unitless measure of effort</em>.</h2>
            <ul className="list-none pl-4">
              <li className="py-2 relative pl-6 before:content-['●'] before:text-blue-700 before:absolute before:left-0">Complexity</li>
              <li className="py-2 relative pl-6 before:content-['●'] before:text-blue-700 before:absolute before:left-0">Uncertainty</li>
              <li className="py-2 relative pl-6 before:content-['●'] before:text-blue-700 before:absolute before:left-0">Work</li>
            </ul>
          </div>
          <div className="bg-gray-200 p-8 rounded-lg text-center text-lg text-gray-700 min-w-[250px]">
            <strong>Not hours!</strong>
            <br />
            Not time estimates!
          </div>
        </div>

        <div className="text-center my-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-2xl text-gray-800">Planning Poker: <span className="text-blue-700 italic">Team discussion to reach consensus.</span></h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-2xl text-gray-800 mb-4 text-center pb-2 border-b-2 border-blue-700">Fibonacci Scale</h3>
            <table className="w-full border-collapse mb-4 bg-white rounded-lg overflow-hidden">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="p-3 text-left border-b border-gray-300">Points</th>
                  <th className="p-3 text-left border-b border-gray-300">Effort</th>
                  <th className="p-3 text-left border-b border-gray-300">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-100">
                  <td className="p-3 border-b border-gray-300"><strong>1</strong></td>
                  <td className="p-3 border-b border-gray-300">Trivial</td>
                  <td className="p-3 border-b border-gray-300"><em>Text Change</em></td>
                </tr>
                <tr className="hover:bg-gray-100">
                  <td className="p-3 border-b border-gray-300"><strong>2</strong></td>
                  <td className="p-3 border-b border-gray-300">Small</td>
                  <td className="p-3 border-b border-gray-300"><em>Simple Validation</em></td>
                </tr>
                <tr className="hover:bg-gray-100">
                  <td className="p-3 border-b border-gray-300"><strong>3</strong></td>
                  <td className="p-3 border-b border-gray-300">Moderate</td>
                  <td className="p-3 border-b border-gray-300"><em>Small API Change</em></td>
                </tr>
                <tr className="hover:bg-gray-100">
                  <td className="p-3 border-b border-gray-300"><strong>5</strong></td>
                  <td className="p-3 border-b border-gray-300">Medium</td>
                  <td className="p-3 border-b border-gray-300"><em>New Page with Backend</em></td>
                </tr>
                <tr className="hover:bg-gray-100">
                  <td className="p-3 border-b border-gray-300"><strong>8</strong></td>
                  <td className="p-3 border-b border-gray-300">Large</td>
                  <td className="p-3 border-b border-gray-300"><em>Feature Across Teams</em></td>
                </tr>
                <tr className="hover:bg-gray-100">
                  <td className="p-3 border-b border-gray-300"><strong>13</strong></td>
                  <td className="p-3 border-b border-gray-300">Very Large</td>
                  <td className="p-3 border-b border-gray-300"><em>Major Workflow (Break Down)</em></td>
                </tr>
              </tbody>
            </table>
            <div className="text-red-600 text-lg text-center p-4 bg-red-100 rounded-lg mt-4">&gt; 13 <strong>Split the Story!</strong></div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-2xl text-gray-800 mb-4 text-center pb-2 border-b-2 border-blue-700">How We Estimate</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-l-4 border-blue-700">
                <div className="bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                <div className="flex-1 flex justify-between items-center">
                  <strong>BA walks through the particular ticket</strong>
                  <div className="text-2xl">📋</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-l-4 border-blue-700">
                <div className="bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                <div className="flex-1 flex justify-between items-center">
                  <strong>Ask Questions</strong>
                  <div className="text-2xl">💬</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-l-4 border-blue-700">
                <div className="bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">3</div>
                <div className="flex-1 flex justify-between items-center">
                  <strong>Pick a Card</strong>
                  <div className="text-2xl">🃏</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-l-4 border-blue-700">
                <div className="bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">4</div>
                <div className="flex-1 flex justify-between items-center">
                  <strong>Reveal & Discuss</strong>
                  <div className="text-2xl">💭</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border-l-4 border-blue-700">
                <div className="bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">5</div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <strong>Assign Final Story Points</strong>
                    <br />
                    <span className="text-sm text-gray-600 italic">(Re-Vote if Needed)</span>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8 mt-12">
          <div className="bg-gray-50 p-0 rounded-lg overflow-hidden">
            <h3 className="text-2xl text-gray-800 mb-0 text-center pb-2 bg-amber-100 p-4 rounded-t-lg">Pointing Session Protocol</h3>
            <ul className="list-none p-6 bg-white m-0 rounded-b-lg">
              <li className="py-3 flex items-center gap-3"><span className="text-2xl">📅</span> Weekly Sessions</li>
              <li className="py-3 flex items-center gap-3"><span className="text-2xl">👥</span> BA, EM, Team</li>
              <li className="py-3 flex items-center gap-3"><span className="text-2xl">📝</span> Review, Discuss & Point Tickets</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-0 rounded-lg overflow-hidden">
            <h3 className="text-2xl text-gray-800 mb-0 text-center pb-2 bg-emerald-100 p-4 rounded-t-lg">Guidelines & Key Points</h3>
            <ul className="list-none p-6 bg-white m-0 rounded-b-lg">
              <li className="py-3 flex items-center gap-3"><strong>No Hours</strong> - Use Past Stories</li>
              <li className="py-3 flex items-center gap-3"><strong>Time Box</strong> Discussions</li>
              <li className="py-3 flex items-center gap-3"><strong>Split Stories</strong> &gt; 13</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-center p-8 mt-12 rounded-lg relative before:content-[''] before:absolute before:top-[-15px] before:left-1/2 before:-translate-x-1/2 before:w-0 before:h-0 before:border-l-[30px] before:border-l-transparent before:border-r-[30px] before:border-r-transparent before:border-b-[30px] before:border-b-orange-600">
          <h2 className="text-3xl font-bold mb-2">Pointing Session Protocol</h2>
          <p className="text-lg italic">Accuracy Improves as We Calibrate Together</p>
        </div>
      </div>
    </div>
  );
}

export default StoryPointing;
