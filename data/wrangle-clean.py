import pandas as pd


# pretty-prints dataframe without truncating
def print_df(df):
    with pd.option_context('display.max_rows', None, 'display.max_columns', None):
        print(df)


def remove_bracket_values(value):
    head, sep, tail = value.partition(" [")
    return head


# load data
unclean_data_path = "data/obesity/obesity-cleaned.csv"
cleaned_data_path = "data/wrangled/obesity-cleaned.csv"
country_codes_path = "data/country_codes/country_codes_adjusted.csv"
df = pd.read_csv(unclean_data_path)

# only keep data for both sexes
df = df[df.Sex == "Both sexes"]

# drop the first two and sex columns
df = df.iloc[:, 1:]
df = df.drop('Sex', axis='columns')

# rename columns
df = df.rename(columns={"Country": "country", "Year": "year", "Obesity (%)": "obesity_percentage"})

# add alpha-3 codes
country_names = df.loc[:, 'country']
country_codes = pd.read_csv(country_codes_path).loc[:, ['name', 'alpha-3']]
country_codes_dict = dict(country_codes.values.tolist())
country_codes = country_names.replace(country_codes_dict)
df['country_code'] = country_codes.values

# remove [0.5 - 1.7] - like data from percentage column
df['obesity_percentage'] = df['obesity_percentage'].apply(remove_bracket_values)

# write to file
print_df(df.iloc[0:10, 0:5])
df.to_csv(cleaned_data_path, index=False)
