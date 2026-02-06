1. (auth), (tabs) folder should have index.jsx -if not present expo doesnt know what to render and will silently fall back to folder with index.jsx

2. This problem i faced during changing screens between auth and tabs - The conditional wasnt working because I create a variable with let/const and set it to true but I couldnt see the output I wanted.
    - FIX: If UI depends on a value, use useState or useEffect.
    - Variables declared with let or const (inside or outside the component) are not tracked by React.

3. I was getting `AsyncStorage is null` ERROR - AsyncStorage is basically storage for mobile devices like localStorage is for browsers. This error occurs becoz asyncStorage is not properly linked. 
    - Uninstall then install the package
    - Rebuild the app `eas build --platform android --profile development`
    - Install the new APK, uninstall the current one.

4. If Backend connection error - Bot was working fine on web but not on android i had to change the backend url to my local ip address. 
   Eg: http://localhost:3000 => http://<ip>:3000

5. Sometimes I dont get the response from supabase because i was destructuring before verifying if the call even succeeded.
    - 🧠 Tip: Always log the full response before destructuring during API debugging.
    - Eg: Before
    ```const { data, error } = await supabase.auth.verifyOtp(...);
       console.log(data); // ❌ Might not run or be undefined```
    - Eg: After
    ```const response = await supabase.auth.verifyOtp(...);
       console.log(response); // ✅ Always log the full response```

6. Axios post request Schema: `axios.post(url, { clientID, secret, grant_type, product_instance_id }, { headers: {...} })
`

#TODO:
0. Put phone.jsx content into index.jsx in (auth) folder
1. Make the auth input text editable

**Implement AUTH:**
Phones.jsx => Verify.jsx
1. Enter Number => Press Button => Store Number => Navigate to Verify.jsx
2. Enter OTP => Press OTP Verify => Navigate to Home.jsx if right otherwise dont