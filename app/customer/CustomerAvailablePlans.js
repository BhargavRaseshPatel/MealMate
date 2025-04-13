import React, { useState, useEffect } from 'react';

const CustomerAvailablePlans = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('CustomerAvailablePlans component mounted');
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      console.log('Starting fetchSubscription function');
      const currentUser = await account.get();
      console.log('Getting current user');
      console.log('Current user retrieved:', currentUser.$id);

      if (!currentUser) {
        console.log('No current user found');
        return;
      }

      // First, get the customer document for the current user
      console.log('Querying customer collection with person_id:', currentUser.$id);
      const customerQuery = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMER_COLLECTION_ID,
        [Query.equal('person_id', currentUser.$id)]
      );

      console.log('Customer query result:', JSON.stringify(customerQuery, null, 2));

      if (customerQuery.documents.length === 0) {
        console.log('No customer document found');
        return;
      }

      const customerId = customerQuery.documents[0].$id;
      console.log('Found customer ID for subscription:', customerId);
      console.log('Customer document:', JSON.stringify(customerQuery.documents[0], null, 2));

      // Now query the customer subscription using the customer ID
      console.log('Querying customer subscription with customer ID:', customerId);
      console.log('Using collection ID:', CUSTOMER_SUBSCRIPTION_COLLECTION_ID);
      
      try {
        // Query customer subscriptions directly using the customer ID
        console.log('Executing customer subscription query...');
        const customerSubscriptionQuery = await databases.listDocuments(
          DATABASE_ID,
          CUSTOMER_SUBSCRIPTION_COLLECTION_ID,
          [Query.equal('subscription_status', 'active')]
        );

        console.log('Customer subscription query result:', JSON.stringify(customerSubscriptionQuery, null, 2));

        // Filter the subscriptions to find the one matching our customer
        console.log('Filtering subscriptions for customer:', customerId);
        const customerSubscription = customerSubscriptionQuery.documents.find(
          doc => {
            console.log('Checking document:', JSON.stringify(doc, null, 2));
            console.log('Document customer field:', doc.customer);
            console.log('Customer ID to match:', customerId);
            return doc.customer && doc.customer[0] === customerId;
          }
        );

        if (customerSubscription) {
          console.log('Found active customer subscription:', JSON.stringify(customerSubscription, null, 2));

          // Get the associated subscription details
          const subscriptionId = customerSubscription.subscription[0];
          console.log('Fetching subscription with ID:', subscriptionId);
          
          const subscriptionDoc = await databases.getDocument(
            DATABASE_ID,
            SUBSCRIPTION_COLLECTION_ID,
            subscriptionId
          );

          console.log('Found subscription details:', JSON.stringify(subscriptionDoc, null, 2));

          // Fetch all associated chef menus for this subscription
          const chefMenuIds = subscriptionDoc.chefMenu || [];
          console.log('Fetching chef menus with IDs:', chefMenuIds);

          const chefMenus = await Promise.all(
            chefMenuIds.map(async (chefMenuId) => {
              try {
                const chefMenuDoc = await databases.getDocument(
                  DATABASE_ID,
                  CHEF_MENU_COLLECTION_ID,
                  chefMenuId
                );
                return chefMenuDoc;
              } catch (error) {
                console.error('Error fetching chef menu:', error);
                return null;
              }
            })
          );

          // Filter out any null values from failed fetches
          const validChefMenus = chefMenus.filter(menu => menu !== null);
          console.log('Found chef menus:', JSON.stringify(validChefMenus, null, 2));

          // Combine the data
          const subscriptionData = {
            ...customerSubscription,
            subscription_details: {
              ...subscriptionDoc,
              chef_menus: validChefMenus
            }
          };

          console.log('Setting subscription data:', JSON.stringify(subscriptionData, null, 2));
          setSubscription(subscriptionData);
        } else {
          console.log('No active customer subscription found for this customer');
        }
      } catch (queryError) {
        console.error('Error in customer subscription query:', queryError);
        console.error('Query error details:', {
          message: queryError.message,
          code: queryError.code,
          type: queryError.type,
          response: queryError.response
        });
        throw queryError;
      }
    } catch (error) {
      console.error('Error handling subscription:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        response: error.response
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default CustomerAvailablePlans; 